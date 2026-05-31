/**
 * PostHog client — analytics + crash/error reporting for Sakina.
 *
 * Import `posthog` anywhere (including non-React services) to capture
 * events. The `PostHogProvider` in App.tsx wraps the component tree for
 * hook-based usage (`usePostHog()`), but the singleton client here works
 * independently for singleton services like errorLoggingService.
 *
 * Required env var:  POSTHOG_API_KEY=phc_xxxx  (add to .env)
 */
import PostHog from 'posthog-react-native';

// @ts-ignore — env var via react-native-dotenv
const API_KEY: string = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@env').POSTHOG_API_KEY ?? '';
  } catch {
    return '';
  }
})();

const posthog = new PostHog(API_KEY || 'phc_placeholder', {
  host: 'https://us.i.posthog.com',
  // Don't send events in development unless explicitly opted in
  disabled: __DEV__ && !API_KEY,
  // Flush frequently enough that crashes don't lose events
  flushAt: 10,
  flushInterval: 10000,
});

export default posthog;
