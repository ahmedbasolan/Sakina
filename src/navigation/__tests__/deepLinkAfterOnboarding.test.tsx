/**
 * Renders the real MainNavigator under a NavigationContainer with the app's
 * real `linking` config, to prove what linking.test.ts can only assert at the
 * router level: a fresh install opening sakina://journeys sees Onboarding
 * first, and lands on Journeys once onboarding hands over (enterGuestMode
 * flips `isGuest`, which swaps the root stack's screens). That replay is
 * React Navigation's `UNSTABLE_routeNamesChangeBehavior="lastUnhandled"` on
 * the root stack — remove it and the "after onboarding" cases land on Home.
 *
 * Screens are stubbed to a Text of their own name; only the navigator wiring
 * is under test.
 */
import 'react-native-gesture-handler/jestSetup';
import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { linking } from '../linking';

const mockAuth = {
  user: null as null | { id: string },
  isGuest: false,
  loading: false,
  isPasswordRecovery: false,
};

jest.mock('../../context/AuthContext', () => ({ useAuth: () => mockAuth }));
jest.mock('../../context/AppContext', () => ({ useAppContext: () => ({ streakCount: 0 }) }));
jest.mock('../../components/FrostedSurface', () => ({ FrostedSurface: () => null }));
jest.mock('../../services/hapticsService', () => ({ HapticsService: { impactAsync: jest.fn() } }));

function mockStub(name: string) {
  const { Text: RNText } = require('react-native');
  return () => <RNText>{`screen:${name}`}</RNText>;
}
jest.mock('../../screens/OnboardingScreen', () => mockStub('Onboarding'));
jest.mock('../../screens/AuthScreens', () => ({
  LoginScreen: mockStub('Login'),
  SignUpScreen: mockStub('SignUp'),
  ResetPasswordScreen: mockStub('ResetPassword'),
}));
jest.mock('../../screens/HomeScreen', () => mockStub('Home'));
jest.mock('../../screens/PathsScreen', () => mockStub('Journeys'));
jest.mock('../../screens/ReflectionHistoryScreen', () => mockStub('Journal'));
jest.mock('../../screens/SettingsScreen', () => mockStub('Settings'));
jest.mock('../../screens/GuidanceScreen', () => mockStub('Guidance'));
jest.mock('../../screens/PathDetailScreen', () => ({ PathDetailScreen: mockStub('PathDetail') }));
jest.mock('../../screens/PathStepScreen', () => ({ PathStepScreen: mockStub('PathStep') }));
jest.mock('../../screens/PrayerTimesScreen', () => mockStub('PrayerTimes'));
jest.mock('../../screens/QuranLibraryScreen', () => mockStub('QuranLibrary'));
jest.mock('../../screens/MoodHistoryCalendarScreen', () => mockStub('Streak'));
jest.mock('../../screens/DailyRemindersScreen', () => mockStub('DailyReminders'));
jest.mock('../../screens/LockscreenVersesScreen', () => mockStub('LockscreenVerses'));
jest.mock('../../screens/MoodSelectionScreen', () => mockStub('MoodSelection'));
jest.mock('../../screens/LibraryScreen', () => mockStub('Library'));
jest.mock('../../screens/SurahReaderScreen', () => mockStub('SurahReader'));
jest.mock('../../screens/SupportSakinaScreen', () => mockStub('Support'));

// Imported after the mocks so it binds to the stubs.
import MainNavigator from '../MainNavigator';

function app(initialURL: string | null) {
  return (
    <NavigationContainer linking={{ ...linking, getInitialURL: () => initialURL }}>
      <MainNavigator />
    </NavigationContainer>
  );
}

function renderApp(initialURL: string | null) {
  return render(app(initialURL));
}

/** What OnboardingScreen's handleOfferDone → enterGuestMode does to auth state. */
function finishOnboarding(rerender: () => void) {
  mockAuth.isGuest = true;
  act(rerender);
}

beforeEach(() => {
  mockAuth.user = null;
  mockAuth.isGuest = false;
  mockAuth.loading = false;
  mockAuth.isPasswordRecovery = false;
});

describe('sakina://journeys and onboarding', () => {
  it('a fresh install opening the link sees Onboarding first', async () => {
    renderApp('sakina://journeys');
    expect(await screen.findByText('screen:Onboarding')).toBeTruthy();
    expect(screen.queryByText('screen:Journeys')).toBeNull();
  });

  it('…and lands on Journeys when onboarding finishes', async () => {
    const view = renderApp('sakina://journeys');
    await screen.findByText('screen:Onboarding');
    finishOnboarding(() =>
      view.rerender(app('sakina://journeys')),
    );
    expect(await screen.findByText('screen:Journeys')).toBeTruthy();
    expect(screen.queryByText('screen:Onboarding')).toBeNull();
  });

  it('a fresh install with no link still lands on Home after onboarding', async () => {
    const view = renderApp(null);
    await screen.findByText('screen:Onboarding');
    finishOnboarding(() =>
      view.rerender(app(null)),
    );
    expect(await screen.findByText('screen:Home')).toBeTruthy();
    expect(screen.queryByText('screen:Journeys')).toBeNull();
  });

  it('a returning guest opening the link goes straight to Journeys', async () => {
    mockAuth.isGuest = true;
    renderApp('sakina://journeys');
    expect(await screen.findByText('screen:Journeys')).toBeTruthy();
  });

  it('an auth redirect on the shared scheme does not navigate a returning guest', async () => {
    mockAuth.isGuest = true;
    renderApp('sakina://#access_token=a&refresh_token=b&type=recovery');
    expect(await screen.findByText('screen:Home')).toBeTruthy();
  });

  it('signing out after a replayed link returns to Onboarding, not a stale replay', async () => {
    const tree = () => app('sakina://journeys');
    const view = renderApp('sakina://journeys');
    await screen.findByText('screen:Onboarding');
    finishOnboarding(() => view.rerender(tree()));
    await screen.findByText('screen:Journeys');

    mockAuth.isGuest = false; // signOut
    act(() => view.rerender(tree()));
    expect(await screen.findByText('screen:Onboarding')).toBeTruthy();

    finishOnboarding(() => view.rerender(tree()));
    // The link was consumed by the first replay; a second onboarding lands on Home.
    expect(await screen.findByText('screen:Home')).toBeTruthy();
  });
});
