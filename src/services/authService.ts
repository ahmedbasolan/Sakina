import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from '../config/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { clearAllLocalUserData } from '../database/operations';

// Lets the in-app browser dismiss itself and hand the redirect back to the app.
WebBrowser.maybeCompleteAuthSession();

/**
 * Thrown by `deleteAccount()` when the server-side delete SUCCEEDED but the
 * on-device wipe did not. Exported so callers can match it exactly instead of
 * sniffing the prose — the two sides would otherwise desync the moment either
 * copy is reworded, and the failure mode is a user being told to retry a
 * deletion that already happened.
 *
 * The text is user-facing: show it verbatim.
 */
export const ACCOUNT_DELETED_BUT_LOCAL_WIPE_FAILED =
  'Your account was deleted, but some data could not be removed from this device. Reinstalling Sakina will clear it.';

// Deep-link the OAuth provider redirects back to — derived from the "sakina"
// scheme in app.json (e.g. sakina://). This EXACT value must be added to the
// provider's redirect allow-list in the Supabase dashboard, or sign-in fails.
const OAUTH_REDIRECT = makeRedirectUri();

export class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private constructor() { }

  async signUpWithEmail(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });
    if (error) throw error;
    return data;
  }

  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  onAuthStateChange(
    callback: (
      event: import('@supabase/supabase-js').AuthChangeEvent,
      session: Session | null,
    ) => void,
  ) {
    const { data } = supabase.auth.onAuthStateChange((event: import('@supabase/supabase-js').AuthChangeEvent, session: Session | null) => {
      callback(event, session);
    });
    return data.subscription;
  }

  /**
   * Sends the reset email with `redirectTo` set to the app's own deep link
   * (the same URI OAuth already uses — see OAUTH_REDIRECT below). Without
   * this, Supabase's default reset link opens Supabase's own generic web
   * page instead of coming back into Sakina, and the recovery flow below
   * never gets a chance to run at all.
   *
   * Requires OAUTH_REDIRECT's value in the Supabase dashboard's Auth →
   * URL Configuration → Redirect URLs allow-list (the same requirement the
   * OAuth comment above already documents — it's one shared list, not
   * per-provider, so no separate entry is needed once that's done).
   */
  async sendPasswordResetEmail(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: OAUTH_REDIRECT,
    });
    if (error) throw error;
  }

  /**
   * Sets a new password on the CURRENT session. Only meaningful right after
   * `completeDeepLink` has set a session from a recovery link — Supabase's
   * `updateUser` changes whichever account is currently signed in, so this
   * must never be exposed anywhere a normal signed-in user could reach it by
   * accident (that's a legitimate "change my password" feature, just not
   * this one).
   */
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  /**
   * Ends a recovery session started by tapping a reset-password email link,
   * without the app-wide implications of a normal sign-out (there are none
   * here — the session backing it only ever existed for the recovery flow).
   * `scope: 'local'` matches deleteAccount()'s reasoning: this only clears
   * the token stored on-device, no network round-trip needed.
   */
  async cancelPasswordRecovery(): Promise<void> {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Best-effort — the auth listener still clears local state either way.
    }
  }

  // ── OAuth ──────────────────────────────────────────────────────────────────
  // NOTE: these only work once the providers are configured in the Supabase
  // dashboard (Google + Apple) and OAUTH_REDIRECT is in each provider's redirect
  // allow-list. Apple additionally needs the "Sign in with Apple" capability on
  // the iOS bundle id. They require a fresh native build (new native modules).

  /** True only where native Apple Sign-In is supported (iOS). */
  async isAppleSignInAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    try {
      return await AppleAuthentication.isAvailableAsync();
    } catch {
      return false;
    }
  }

  /**
   * Google sign-in via Supabase's OAuth web flow: open the provider in an
   * in-app browser, then turn the redirect back into a Supabase session.
   * Resolves to null if the user dismisses the browser (treated as a cancel).
   */
  async signInWithGoogle(): Promise<Session | null> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: OAUTH_REDIRECT, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data?.url) throw new Error('Could not start Google sign-in.');

    const result = await WebBrowser.openAuthSessionAsync(data.url, OAUTH_REDIRECT);
    if (result.type !== 'success' || !result.url) return null; // dismissed / cancelled

    const { session } = await this.completeDeepLink(result.url);
    // completeDeepLink treats a tokenless URL as benign (see its own doc
    // comment — a generic sakina:// link legitimately might not carry auth
    // tokens). That tolerance is wrong here specifically: WebBrowser already
    // reported this exact redirect as 'success', so at this call site the URL
    // is guaranteed to be Supabase's own OAuth response — missing tokens on
    // it means something broke, not "nothing to do." Re-assert the error this
    // path used to throw before completeDeepLink was generalised, or a
    // misconfigured provider fails completely silently instead of showing
    // "Google Sign-In Failed".
    if (!session) throw new Error('Sign-in did not return a complete session.');
    return session;
  }

  /**
   * Exchanges any Supabase auth redirect URL — OAuth success, or a tapped
   * password-recovery email link — for a persisted session, and reports
   * `type` (Supabase's own `?type=recovery` param, `null` for a plain OAuth
   * redirect) so the caller can tell which one it just completed.
   *
   * `detectSessionInUrl: false` in supabaseClient.ts means Supabase's own
   * auto-detection never runs (there's no URL bar for it to read), so this
   * manual exchange is required for BOTH flows, not just recovery — this
   * used to be `createSessionFromUrl`, private to the Google OAuth path
   * only, generalised here so the deep-link listener in AuthContext can
   * reuse the exact same token-exchange logic instead of a second copy of it.
   */
  async completeDeepLink(url: string): Promise<{ session: Session | null; type: string | null }> {
    const { params, errorCode } = QueryParams.getQueryParams(url);
    if (errorCode) throw new Error(errorCode);
    const { access_token, refresh_token, type } = params;
    if (!access_token || !refresh_token) {
      // Not every URL the app's scheme receives is an auth link — a share
      // link or a future feature could reuse the same `sakina://` scheme
      // with no tokens at all. Absence is not an error here, just "nothing
      // to complete."
      return { session: null, type: null };
    }

    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) throw error;
    return { session: data.session, type: type ?? null };
  }

  /**
   * Native Apple sign-in (iOS only). Throws on non-iOS. User cancellation
   * surfaces as an error with code 'ERR_REQUEST_CANCELED' — callers should
   * swallow that quietly rather than showing an error.
   */
  async signInWithApple() {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple sign-in is only available on iOS.');
    }
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      throw new Error('Apple did not return an identity token.');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error) throw error;

    // Apple returns the full name ONLY on the first authorization. Persist it
    // so the profile isn't blank on subsequent sign-ins.
    const fullName = credential.fullName;
    if (fullName && (fullName.givenName || fullName.familyName)) {
      const display = [fullName.givenName, fullName.familyName].filter(Boolean).join(' ').trim();
      if (display) {
        await supabase.auth.updateUser({ data: { full_name: display } }).catch(() => {});
      }
    }
    return data;
  }

  /**
   * Permanently deletes the current user's account and all associated data.
   * Required by App Store Review Guidelines 5.1.1.
   * Calls the delete-account Edge Function which uses service_role to cascade
   * the deletion across all user tables.
   */
  async deleteAccount(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Please sign in again to delete your account.');

    // supabase.functions.invoke handles token refresh automatically, unlike a
    // raw fetch which would send an expired access_token if getSession() returns
    // a stale session.
    const { error } = await supabase.functions.invoke('delete-account', {
      method: 'POST',
    });

    if (error) throw new Error(`Account deletion failed: ${error.message}`);

    // Wipe the on-device copy BEFORE dropping the session. The server rows are
    // already gone; leaving the local ones behind both makes the Settings
    // confirmation ("deleted forever") false and lets the next sign-in on this
    // device re-upload this account's history into someone else's — see
    // clearAllLocalUserData's docstring. Awaited, not fire-and-forget: the
    // auth listener fires on signOut below and starts tearing the tree down.
    let localWipeFailed = false;
    try {
      await clearAllLocalUserData();
    } catch (wipeError) {
      // Past the point of no return: the account is gone server-side. Do NOT
      // rethrow as a deletion failure — the caller would tell the user to retry
      // an operation that already succeeded and can only fail from here on.
      // Sign out anyway so they aren't stranded in a session for a dead account.
      localWipeFailed = true;
      console.error('[AuthService] Local data wipe after account deletion failed:', wipeError);
    }

    // Clear local session only — the account no longer exists server-side so a
    // global signOut round-trip would fail (user not found). scope:'local' skips
    // the network call and just wipes the stored token.
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Best-effort: auth listener will still fire and clear local state.
    }

    if (localWipeFailed) {
      // Deliberately thrown after the sign-out: deletion succeeded, cleanup did not.
      throw new Error(ACCOUNT_DELETED_BUT_LOCAL_WIPE_FAILED);
    }
  }
}
