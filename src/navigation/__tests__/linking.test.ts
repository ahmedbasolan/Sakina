import { getActionFromState, getStateFromPath } from '@react-navigation/native';
import { StackRouter } from '@react-navigation/routers';
import { deepLinkPath, isNavigationDeepLink, linking } from '../linking';

/** What NavigationContainer does with a URL: filter, strip the prefix, parse. */
function stateForUrl(url: string) {
  if (!linking.filter!(url)) return undefined;
  const path = deepLinkPath(url);
  return path === undefined ? undefined : getStateFromPath(path, linking.config);
}

describe('deep linking', () => {
  describe('links that navigate', () => {
    it.each([
      'sakina://journeys',
      'sakina:///journeys',
      'sakina://journeys/',
      'sakina://journeys?ppid=journeys',
    ])('%s opens the Journeys tab inside Main', (url) => {
      const state = stateForUrl(url);
      expect(state?.routes).toHaveLength(1);
      expect(state?.routes[0].name).toBe('Main');
      expect(state?.routes[0].state?.routes[0].name).toBe('Journeys');
    });

    it('a link arriving while the app is open becomes a navigate to Main > Journeys', () => {
      const action = getActionFromState(stateForUrl('sakina://journeys')!, linking.config);
      expect(action).toMatchObject({
        type: 'NAVIGATE',
        payload: { name: 'Main', params: { screen: 'Journeys' } },
      });
    });
  });

  describe('URLs that must not navigate', () => {
    it.each([
      // Supabase auth redirects on the shared scheme — AuthContext owns these.
      'sakina://?code=abc123',
      'sakina://#access_token=a&refresh_token=b&type=recovery',
      'sakina://?error=access_denied&error_code=otp_expired',
      'sakina://',
      // Not an allowlisted path, even though it names a real screen.
      'sakina://Settings',
      'sakina://Journeys',
      'sakina://journeys/extra',
      'sakina://journeys-old',
      // Other schemes, including the Expo dev client's own.
      'exp+sakina://expo-development-client/?url=http%3A%2F%2F10.0.0.2%3A8081',
      'https://sakina.app/journeys',
    ])('%s is filtered out', (url) => {
      expect(isNavigationDeepLink(url)).toBe(false);
      expect(stateForUrl(url)).toBeUndefined();
    });

    it.each(['', '?code=abc123', '#access_token=a&refresh_token=b&type=recovery', 'Settings'])(
      'the config alone also ignores path %j (the filter is a second layer)',
      (path) => {
        expect(getStateFromPath(path, linking.config)).toBeUndefined();
      },
    );

    it('without a config, the same auth fragment WOULD become a route — never drop both layers', () => {
      // Negative control: proves the two assertions above are not vacuous.
      const unconfigured = getStateFromPath('#access_token=a&type=recovery');
      expect(unconfigured?.routes[0].name).toBe('#access_token=a&type=recovery');
    });
  });

  describe('onboarding gating', () => {
    // MainNavigator defines only `Onboarding` until there is a user or guest.
    const linked = stateForUrl('sakina://journeys')!;

    it('a fresh install opening the link still lands on Onboarding', () => {
      const router = StackRouter({});
      const routeNames = ['Onboarding'];
      const state = router.getRehydratedState(linked as any, {
        routeNames,
        routeParamList: { Onboarding: undefined },
        routeGetIdList: {},
      });
      expect(state.routes.map((r) => r.name)).toEqual(['Onboarding']);
    });

    it('a returning user lands on Main with the linked Journeys state', () => {
      const router = StackRouter({ initialRouteName: 'Main' });
      const routeNames = ['Main', 'Guidance', 'PathDetail', 'Settings'];
      const state = router.getRehydratedState(linked as any, {
        routeNames,
        routeParamList: Object.fromEntries(routeNames.map((n) => [n, undefined])),
        routeGetIdList: {},
      });
      expect(state.routes.map((r) => r.name)).toEqual(['Main']);
      expect((state.routes[0] as any).state.routes[0].name).toBe('Journeys');
    });
  });
});
