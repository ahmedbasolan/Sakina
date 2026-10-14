import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/**
 * React Navigation deep linking — `sakina://journeys` opens the Journeys tab.
 * Its first user is the App Store custom product page for Journeys, whose
 * deep link field takes this URL.
 *
 * The `sakina://` scheme is shared with Supabase auth: OAuth redirects and
 * password-recovery links arrive as `sakina://?code=…` or
 * `sakina://#access_token=…&type=recovery`, and AuthContext reads them off
 * the same `Linking` events. Both listeners receive every URL, so nothing
 * here can swallow an auth link — but React Navigation must not *act* on
 * one either. With `config` set, getStateFromPath already returns undefined
 * for any path it does not match (auth fragments included); `filter` is a
 * second, independent layer — an allowlist of exact paths — so the auth
 * links stay inert even if `config` is later loosened. Note that WITHOUT a
 * `config`, getStateFromPath turns any path into routes named after its
 * segments (`#access_token=…` becomes a route name), so never drop both.
 *
 * Gating: a link resolves to Main → Journeys, and MainNavigator only defines
 * `Main` once there is a user or guest. On a fresh install the root stack
 * holds just `Onboarding`, the stack drops the unknown `Main` route when it
 * rehydrates the linked state, and onboarding runs as normal. The root
 * stack's `UNSTABLE_routeNamesChangeBehavior="lastUnhandled"` (MainNavigator)
 * then replays the link once onboarding finishes, so the user lands on
 * Journeys rather than Home.
 *
 * Adding a link: add its path to DEEP_LINK_PATHS *and* to `config`, and to
 * the cases in `__tests__/linking.test.ts`.
 */

export const DEEP_LINK_PREFIX = 'sakina://';

const DEEP_LINK_PATHS: ReadonlySet<string> = new Set(['journeys']);

/**
 * The path of a `sakina://` URL with slashes trimmed and any query or
 * fragment removed (`sakina:///journeys/?x=1` → `journeys`), or undefined
 * for a URL on any other scheme. Case is kept: links are matched exactly.
 */
export function deepLinkPath(url: string): string | undefined {
  const match = /^sakina:\/*([^?#]*)/.exec(url);
  return match ? match[1].replace(/\/+$/, '') : undefined;
}

/** True only for URLs that React Navigation should turn into navigation. */
export function isNavigationDeepLink(url: string): boolean {
  const path = deepLinkPath(url);
  return path !== undefined && DEEP_LINK_PATHS.has(path);
}

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [DEEP_LINK_PREFIX],
  filter: isNavigationDeepLink,
  config: {
    screens: {
      Main: {
        screens: {
          Journeys: 'journeys',
        },
      },
    },
  },
};
