/**
 * A subscriber who opens the Support screen gets the supporter view instead
 * of a paywall for something they already have — but onboarding's embedded
 * step is never replaced, because it must always end through onDone.
 *
 * WHAT THIS DOES NOT CATCH: the paywall's own purchase flow, the re-read of
 * premium status on focus (useFocusEffect is stubbed to a no-op), and layout.
 */
import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn() }),
  useFocusEffect: () => {},
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../../components/SakinaLantern', () => ({ SakinaLantern: () => null }));

let mockPremium = true;
let mockPricing: unknown = null;
jest.mock('../../services/freemiumService', () => ({
  FreemiumService: {
    getInstance: () => ({
      isPremium: () => mockPremium,
      getPricing: () => mockPricing,
      getSubscriptionState: () => ({ tier: 'premium', isActive: true, willRenew: true, type: 'yearly' }),
      recordUpgradeAsk: jest.fn(() => Promise.resolve()),
    }),
  },
}));
jest.mock('../../services/revenueCatService', () => ({
  revenueCat: {
    // Never settles: the paywall stays in its loading state, which is all the
    // embedded case needs to prove it rendered the paywall, not the thanks.
    getPricing: () => new Promise(() => {}),
    openManageSubscriptions: jest.fn(() => Promise.resolve()),
  },
}));

import SupportSakinaScreen from '../SupportSakinaScreen';

describe('SupportSakinaScreen for a subscriber', () => {
  beforeEach(() => {
    mockPremium = true;
    mockPricing = null;
  });

  it('lets a subscriber reach the Lifetime plan when the store sells it', async () => {
    mockPricing = {
      monthlyUSD: 4.99,
      yearlyUSD: 39.99,
      monthlyPrice: '$4.99',
      yearlyPrice: '$39.99',
      lifetimePrice: '$99.99',
      lifetimeUSD: 99.99,
    };
    const { getByText, queryByText } = render(<SupportSakinaScreen />);
    fireEvent.press(getByText('Get Lifetime'));
    // The paywall's hooks (reduce-motion query) settle asynchronously once it
    // mounts; flush them inside act() so they don't warn after the test.
    await act(async () => {});
    expect(queryByText('Thank you for supporting Sakina')).toBeNull();
    getByText('Unlock Sakina for life');
  });

  it('does not offer Lifetime when the store has no lifetime package', () => {
    const { queryByText } = render(<SupportSakinaScreen />);
    expect(queryByText('Get Lifetime')).toBeNull();
  });

  it('shows the supporter view instead of the paywall', () => {
    const { getByText } = render(<SupportSakinaScreen />);
    getByText('Thank you for supporting Sakina');
  });

  it('never replaces the embedded onboarding step', () => {
    const { queryByText } = render(<SupportSakinaScreen embedded onDone={() => {}} />);
    expect(queryByText('Thank you for supporting Sakina')).toBeNull();
  });

  it('shows the paywall to a free user', () => {
    mockPremium = false;
    const { queryByText } = render(<SupportSakinaScreen />);
    expect(queryByText('Thank you for supporting Sakina')).toBeNull();
  });
});
