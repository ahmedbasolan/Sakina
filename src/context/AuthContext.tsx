import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Linking } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../services/authService';
import { SupabaseDataService } from '../services/supabaseDataService';
import { revenueCat } from '../services/revenueCatService';
import { SubscriptionService } from '../services/subscriptionService';
import { STORAGE_KEYS } from '../constants';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isGuest: boolean;
  loading: boolean;
  onboardingComplete: boolean;
  signOut: () => Promise<void>;
  enterGuestMode: (didCompleteOnboarding?: boolean) => Promise<void>;
  /**
   * True from the moment a tapped password-recovery email link has been
   * exchanged for a session until the user either finishes changing their
   * password or cancels. MainNavigator reads this to show ONLY the
   * password-reset screen — Supabase's own `setSession` call from that link
   * is otherwise indistinguishable from a normal sign-in, so without this
   * flag a stale recovery link would drop the user straight into the app
   * signed in, with their old (compromised/forgotten) password still valid
   * and nothing having actually been reset.
   */
  isPasswordRecovery: boolean;
  /** Ends the recovery session and returns to a normal signed-out state. */
  cancelPasswordRecovery: () => Promise<void>;
  /** Clears the recovery gate once a new password is set, or once the user
   *  signs in normally instead of finishing the reset — see the Cancel path
   *  on ResetPasswordScreen for why sign-in also needs to call this. */
  completePasswordRecovery: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Runs an RC identity call (logIn/logOut) then always resyncs entitlement
// state afterward, success or failure. `.finally()` rather than `.then()`:
// logIn()/logOut() have no internal error handling, so a rejection (RC
// misconfigured, offline, invalid API key on this build) used to propagate
// past a `.then()`-chained resync and skip it entirely — including
// resync's own __DEV__ owner-override check, which never touches RC at all.
function syncEntitlementAfter(rcCall: Promise<void>, email?: string | null): void {
  rcCall
    .catch(() => {})
    .finally(() => {
      SubscriptionService.getInstance().resync(email).catch(() => {});
    });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const authService = AuthService.getInstance();
  // Guards the once-per-process local-data claim below. A ref, so it resets on
  // app restart — which is precisely why the claim has to re-derive ownership
  // from storage rather than assume the data belongs to whoever signs in.
  const hasClaimedLocalData = useRef(false);

  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      try {
        const currentSession = await authService.getCurrentSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession) {
          // Signed-in user has always completed onboarding.
          setOnboardingComplete(true);
          // Populate subscription state for a returning signed-in user — the
          // SIGNED_IN listener below only fires on a fresh sign-in transition,
          // not on the INITIAL_SESSION read, so cold boot needs its own resync.
          SubscriptionService.getInstance().resync(currentSession.user.email).catch(() => {});
          // Cold boot with a session never passes through the SIGNED_IN claim
          // below, so installs predating the ownership marker would otherwise
          // never get one — and their queued offline rows would never sync.
          // No-ops when a marker already exists.
          SupabaseDataService.getInstance()
            .ensureLocalDataOwnerStamp(currentSession.user.id)
            .catch((err) => console.error('[Auth] Owner stamp error:', err));
        } else {
          // No Supabase session — check AsyncStorage flags set during onboarding.
          // `onboarding` = completed onboarding at least once (never show it again).
          // `guestSession` = user is actively in guest mode (cleared on explicit sign-out).
          // Keeping these two flags separate lets a signed-out user land on Auth
          // on cold restart rather than silently re-entering guest mode.
          const [onboardingDone, guestActive] = await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.onboarding),
            AsyncStorage.getItem(STORAGE_KEYS.guestSession),
          ]);
          if (onboardingDone === 'true') setOnboardingComplete(true);
          if (guestActive === 'true') {
            setIsGuest(true);
          } else if (onboardingDone === 'true') {
            // Onboarding was completed but guest session was cleared (sign-out, token expiry).
            // Auto-restore guest mode — Auth screen is only reachable via Settings, never automatic.
            setIsGuest(true);
            AsyncStorage.setItem(STORAGE_KEYS.guestSession, 'true').catch(() => {});
          }
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const subscription = authService.onAuthStateChange((event, currentSession) => {
      // INITIAL_SESSION fires on every mount to report current state; it is not
      // an auth transition — skip it and let checkSession() own the initial read.
      if (event === 'INITIAL_SESSION') return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        setIsGuest(false);
        setOnboardingComplete(true);
        // Clear any stale guest-session flag written before this sign-in so
        // cold restarts after token expiry or account deletion don't silently
        // re-enter guest mode.
        AsyncStorage.removeItem(STORAGE_KEYS.guestSession).catch(() => {});

        // Link RC identity so cross-device entitlements work and the future
        // webhook can map purchases back to this Supabase user_id, then
        // re-sync entitlement state for THIS identity — without this, a
        // shared device switching accounts kept showing the previous
        // account's premium/free status until an app restart.
        syncEntitlementAfter(revenueCat.logIn(currentSession.user.id), currentSession.user.email);

        // Decide what the on-device rows are before touching them: this user's
        // own queued writes, unowned guest data to migrate, or another
        // account's leftovers to wipe. Must stay claimLocalDataForUser and not
        // migrateGuestDataToSupabase — the bare migration uploads whatever is
        // on the device under whoever just signed in, which is how account A's
        // history ended up in account B on a shared device.
        if (!hasClaimedLocalData.current) {
          hasClaimedLocalData.current = true;
          SupabaseDataService.getInstance()
            .claimLocalDataForUser(currentSession.user.id)
            .then(({ migratedCount, wipedForeignData }) => {
              if (wipedForeignData) {
                console.log('[Auth] Cleared another account\'s local data before sign-in');
              } else if (migratedCount > 0) {
                console.log(`[Auth] Migrated ${migratedCount} guest history entries to Supabase`);
              }
            })
            .catch((err) => console.error('[Auth] Local data claim error:', err));
        }
      } else {
        // SIGNED_OUT — token expiry, account deletion, or explicit sign-out.
        // Clear guest state regardless of how sign-out was triggered.
        setIsGuest(false);
        AsyncStorage.removeItem(STORAGE_KEYS.guestSession).catch(() => {});
        // Revert RC to anonymous ID so the next sign-in gets a clean identity,
        // then re-sync so this device's entitlement state matches the
        // now-anonymous identity instead of the departed account's.
        syncEntitlementAfter(revenueCat.logOut());
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Deep-link listener for auth redirects that arrive OUTSIDE any in-app
  // browser session — specifically, a password-recovery link tapped in the
  // user's email app. Google OAuth doesn't need this: it captures its
  // redirect directly via WebBrowser.openAuthSessionAsync's own return value
  // (see signInWithGoogle). A recovery link has no such capture point — the
  // OS hands the URL to Sakina however the app happens to be at that moment,
  // running (the 'url' event) or not (getInitialURL, for a cold start).
  useEffect(() => {
    const handleUrl = async (url: string) => {
      try {
        const { session: recoverySession, type } = await authService.completeDeepLink(url);
        if (recoverySession && type === 'recovery') {
          setIsPasswordRecovery(true);
        }
        // A non-recovery deep link (or none at all) needs no action here —
        // completeDeepLink's own setSession call, if it made one, already
        // let the onAuthStateChange listener above pick up the new session
        // through its normal SIGNED_IN handling.
      } catch (error) {
        console.error('[Auth] Failed to process deep link:', error);
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, []);

  const cancelPasswordRecovery = async () => {
    await authService.cancelPasswordRecovery();
    setIsPasswordRecovery(false);
  };

  const completePasswordRecovery = () => {
    setIsPasswordRecovery(false);
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      // On success, the SIGNED_OUT subscriber fires and clears isGuest + storage.
    } catch (error) {
      console.error('Error signing out:', error);
      // Subscriber won't fire on error (e.g. AuthSessionMissingError for guests).
      // Clear guest state manually so the user isn't permanently trapped.
      setIsGuest(false);
      AsyncStorage.removeItem(STORAGE_KEYS.guestSession).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const enterGuestMode = async (didCompleteOnboarding = false) => {
    setIsGuest(true);
    setOnboardingComplete(true);
    const writes: Promise<void>[] = [
      AsyncStorage.setItem(STORAGE_KEYS.guestSession, 'true').catch(() => {}),
    ];
    // Only mark onboarding done in storage when the user actually completed the
    // flow (CommitScreen / WelcomeScreen skip). Auth-screen "Continue as Guest"
    // bypasses onboarding — don't write the key so they see it on cold restart.
    if (didCompleteOnboarding) {
      writes.push(AsyncStorage.setItem(STORAGE_KEYS.onboarding, 'true').catch(() => {}));
    }
    await Promise.all(writes);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isGuest,
        loading,
        onboardingComplete,
        signOut,
        enterGuestMode,
        isPasswordRecovery,
        cancelPasswordRecovery,
        completePasswordRecovery,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
