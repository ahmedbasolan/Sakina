/**
 * PostHog client — crash/error reporting for Sakina.
 *
 * Import `posthog` anywhere (including non-React services) to capture
 * events. The `PostHogProvider` in App.tsx wraps the component tree for
 * hook-based usage (`usePostHog()`), but the singleton client here works
 * independently for singleton services like errorLoggingService.
 *
 * Required env var:  POSTHOG_API_KEY=phc_xxxx  (add to .env)
 *
 * Consent: call `loadAnalyticsConsent()` once during app init, then use
 * `setAnalyticsConsent(bool)` from SettingsScreen to honor user choice.
 */
import PostHog from 'posthog-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// @ts-ignore — env var via react-native-dotenv
const API_KEY: string = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@env').POSTHOG_API_KEY ?? '';
  } catch {
    return '';
  }
})();

const CONSENT_KEY = '@analytics_consent';

const posthog = new PostHog(API_KEY || 'phc_placeholder', {
  host: 'https://us.i.posthog.com',
  disabled: __DEV__ && !API_KEY,
  flushAt: 10,
  flushInterval: 10000,
});

/** Call once during app init to restore the user's saved consent choice. */
export async function loadAnalyticsConsent(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(CONSENT_KEY);
    // Default: opted in (crash reports only — no cross-app tracking / ATT scope)
    if (stored === 'false') {
      posthog.optOut();
    } else {
      posthog.optIn();
    }
  } catch {
    // Leave default state on storage failure
  }
}

/** Persist and apply the user's analytics consent choice. */
export async function setAnalyticsConsent(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(CONSENT_KEY, String(enabled));
  if (enabled) {
    posthog.optIn();
  } else {
    posthog.optOut();
  }
}

/** Read the stored consent value (defaults to true if not yet set). */
export async function getAnalyticsConsent(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(CONSENT_KEY);
    return stored !== 'false';
  } catch {
    return true;
  }
}

export default posthog;
