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
 *
 * Default state is opted-OUT. PostHog starts disabled and is only enabled
 * after loadAnalyticsConsent() resolves with a stored 'true' preference.
 * This prevents the global error handler (wired at module load, before the
 * async consent read completes) from firing events without consent.
 */
import PostHog from 'posthog-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY: string = (() => {
  try {
    return require('@env').POSTHOG_API_KEY ?? '';
  } catch {
    return '';
  }
})();

const CONSENT_KEY = '@analytics_consent';

// Start disabled — consent must be explicitly loaded before any events fire.
// This covers the race window between module load (when error handlers are
// installed) and the async loadAnalyticsConsent() call in app init.
const posthog = new PostHog(API_KEY || 'phc_placeholder', {
  host: 'https://us.i.posthog.com',
  disabled: true,
  // Crash/error reporting only — no usage analytics. App-lifecycle events
  // (App Opened/Backgrounded/Installed/Updated) default to ON in the SDK, so we
  // disable them here to keep the "Share Crash Reports" consent label accurate
  // and avoid having to disclose app-activity data in the store privacy forms.
  captureAppLifecycleEvents: false,
  flushAt: 10,
  flushInterval: 10000,
});

/** Call once during app init to restore the user's saved consent choice. */
export async function loadAnalyticsConsent(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(CONSENT_KEY);
    // Only opt in when the user has explicitly agreed ('true' stored).
    // null (first install, no preference set yet) stays opted out — the
    // Settings toggle defaults to false and the user can enable it.
    if (stored === 'true') {
      posthog.optIn();
    } else {
      posthog.optOut();
    }
  } catch {
    // Storage failure — leave PostHog disabled (safe default).
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

/** Read the stored consent value (defaults to false if not yet set). */
export async function getAnalyticsConsent(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(CONSENT_KEY);
    return stored === 'true';
  } catch {
    return false;
  }
}

export default posthog;
