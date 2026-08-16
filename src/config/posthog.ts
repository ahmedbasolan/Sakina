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
 * Default state is opted-OUT. This prevents the global error handler (wired at
 * module load, before the async consent read completes) from firing events
 * without consent.
 *
 * The opt-out default MUST come from `defaultOptIn: false`, never from
 * `disabled: true`. `disabled` is assigned once in the PostHog constructor
 * (@posthog/core posthog-core-stateless.ts) and is never reassigned; `optIn()`
 * runs inside `wrap()`, which returns early while disabled. So `disabled: true`
 * makes optIn() a permanent no-op — the Settings toggle flips, the consent is
 * persisted, and not a single event is ever sent. It shipped that way.
 *
 * `defaultOptIn: false` closes the same race properly: `optedOut` resolves to
 * `persisted ?? !defaultOptIn`, and RN's persisted store hydrates async, so
 * everything before hydration reads as opted out. `enqueue()` checks `optedOut`
 * and drops the event.
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

// Opted out until the user says otherwise — see the note above on why this is
// `defaultOptIn: false` and not `disabled: true`. Covers the race window between
// module load (when error handlers are installed) and the async
// loadAnalyticsConsent() call in app init.
const posthog = new PostHog(API_KEY || 'phc_placeholder', {
  host: 'https://us.i.posthog.com',
  defaultOptIn: false,
  // The one legitimate use of `disabled`: with no key configured there is no
  // project to report to, so stay hard-off rather than posting the placeholder
  // key at a real ingest host. With a key present this is false and consent
  // alone decides, which is the whole point of the change above.
  disabled: !API_KEY,
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
