/**
 * The PREMIUM corner badge says "Pro opens this". It must sit only on cards
 * Pro actually opens — not on contentless "Coming soon" stubs, which are
 * locked for everyone (a Pro user saw PREMIUM on sixteen of them).
 *
 * WHAT THIS DOES NOT CATCH: layout, the entrance animation, and whether the
 * screen passes the right access to each card (accessFor is not exercised).
 */
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
  useFocusEffect: () => {},
}));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));
jest.mock('../../components/FrostedSurface', () => ({
  FrostedSurface: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('../../components/JourneyMandalaBackdrop', () => ({ JourneyMandalaBackdrop: () => null }));
jest.mock('../../components/TwinklingStar', () => ({ TwinklingStar: () => null }));
// The screen's services pull in the database and Supabase; the card uses neither.
jest.mock('../../services/pathsService', () => ({ PathsService: { getInstance: () => ({}) } }));
jest.mock('../../services/subscriptionService', () => ({
  SubscriptionService: { getInstance: () => ({ isPremium: () => false }) },
}));

import { JourneyCard } from '../PathsScreen';

const path = { id: 'path_rizq_revolution', title: 'Rizq', theme: 'Anxious', description: 'd', duration: 7 };
const noop = () => {};

describe('JourneyCard PREMIUM badge', () => {
  it('shows PREMIUM on a card Pro would open', () => {
    const { getByText } = render(
      <JourneyCard path={path} index={0} isActive={false} isLocked proLocked statusLabel="Sakina Pro exclusive" onPress={noop} />,
    );
    getByText('PREMIUM');
  });

  it('does not show PREMIUM on a Coming soon stub', () => {
    const { queryByText, getByText } = render(
      <JourneyCard path={path} index={0} isActive={false} isLocked proLocked={false} statusLabel="Coming soon" onPress={noop} />,
    );
    getByText('COMING SOON');
    expect(queryByText('PREMIUM')).toBeNull();
  });
});
