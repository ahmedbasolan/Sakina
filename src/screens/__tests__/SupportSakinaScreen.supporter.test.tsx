/**
 * A subscriber who opens the Support screen gets the supporter view instead
 * of a paywall for something they already have — but onboarding's embedded
 * step is never replaced, because it must always end through onDone.
 *
 * WHAT THIS DOES NOT CATCH: the paywall's own purchase flow, the re-read of
 * premium status on focus (useFocusEffect is stubbed to a no-op), and layout.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

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
jest.mock('../../services/freemiumService', () => ({
  FreemiumService: {
    getInstance: () => ({
      isPremium: () => mockPremium,
      getPricing: () => null,
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
