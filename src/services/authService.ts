import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from '../config/supabaseClient';
import { Session } from '@supabase/supabase-js';

// Lets the in-app browser dismiss itself and hand the redirect back to the app.
WebBrowser.maybeCompleteAuthSession();

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

  async sendPasswordResetEmail(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
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

    return this.createSessionFromUrl(result.url);
  }

  /** Exchange the OAuth redirect URL for a persisted Supabase session. */
  private async createSessionFromUrl(url: string): Promise<Session | null> {
    const { params, errorCode } = QueryParams.getQueryParams(url);
    if (errorCode) throw new Error(errorCode);
    const { access_token, refresh_token } = params;
    if (!access_token || !refresh_token) throw new Error('Sign-in did not return a complete session.');

    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) throw error;
    return data.session;
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

    // Clear local session only — the account no longer exists server-side so a
    // global signOut round-trip would fail (user not found). scope:'local' skips
    // the network call and just wipes the stored token.
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Best-effort: auth listener will still fire and clear local state.
    }
  }
}
