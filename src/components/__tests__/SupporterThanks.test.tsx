/**
 * The supporter view must never print a date it does not have, and must say
 * plainly when nothing new has shipped yet rather than imply a promise.
 *
 * WHAT THIS DOES NOT CATCH: layout on a device, safe-area clearance, and
 * whether the store's manage sheet actually opens (native).
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import SupporterThanks from '../SupporterThanks';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
// The lantern is an Image + Svg glow with its own reduce-motion hook; it is
// decoration here and not what this test is about.
jest.mock('../SakinaLantern', () => ({ SakinaLantern: () => null }));
// Ionicons loads its font asynchronously and re-renders outside act(); the
// icons are decoration and not what these tests check.
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../../constants/journeyAvailability', () => ({
  EARLY_ACCESS_DAYS: 30,
  AVAILABLE_PATHS: { path_screen_detox: { released: '2026-12-15', access: 'early_access' } },
  AVAILABLE_PATH_IDS: new Set(['path_screen_detox']),
}));

const base = { tier: 'premium' as const, isActive: true, willRenew: true, type: 'yearly' as const };
const noop = () => {};

describe('SupporterThanks', () => {
  it('shows supporting-since and a journey still in early access', () => {
    const since = new Date(2026, 11, 1).getTime();
    const { getByText } = render(
      <SupporterThanks state={{ ...base, supporterSinceMs: since }} today="2026-12-20" onClose={noop} onManage={noop} />,
    );
    getByText(/Supporting since Dec 1, 2026/);
    getByText('Screen Detox');
    getByText(/opens to everyone on Jan 14/);
  });

  it('shows the honest empty state when nothing shipped since they joined', () => {
    const since = new Date(2027, 0, 5).getTime();
    const { getByText } = render(
      <SupporterThanks state={{ ...base, supporterSinceMs: since }} today="2027-01-06" onClose={noop} onManage={noop} />,
    );
    getByText(/The next journey is being written/);
  });

  it('omits the date and the list when supporter-since is unknown', () => {
    const { queryByText, toJSON } = render(
      <SupporterThanks state={base} today="2026-12-20" onClose={noop} onManage={noop} />,
    );
    expect(queryByText(/Supporting since/)).toBeNull();
    expect(queryByText(/Built since you joined/)).toBeNull();
    expect(JSON.stringify(toJSON())).not.toMatch(/Invalid Date|1970/);
  });

  it('offers Manage subscription only when the store gave a management URL', () => {
    const withUrl = render(
      <SupporterThanks
        state={{ ...base, managementUrl: 'https://apps.apple.com/account/subscriptions' }}
        today="2026-12-20"
        onClose={noop}
        onManage={noop}
      />,
    );
    withUrl.getByText('Manage subscription');
    // Lifetime and promotional grants (the App Review demo account) carry no URL.
    const lifetime = render(
      <SupporterThanks state={{ ...base, type: 'lifetime', willRenew: false }} today="2026-12-20" onClose={noop} onManage={noop} />,
    );
    expect(lifetime.queryByText('Manage subscription')).toBeNull();
  });

  it('says "Lifetime" for a lifetime unlock and "Pro until" for a cancelled plan', () => {
    const end = new Date(2027, 2, 3).getTime();
    render(
      <SupporterThanks state={{ ...base, type: 'lifetime', willRenew: false }} today="2026-12-20" onClose={noop} onManage={noop} />,
    ).getByText(/Lifetime/);
    render(
      <SupporterThanks state={{ ...base, willRenew: false, subscriptionEndDate: end }} today="2026-12-20" onClose={noop} onManage={noop} />,
    ).getByText('Pro until Mar 3, 2027');
  });
});

describe('SupporterThanks — Lifetime upgrade', () => {
  // Lifetime is a non-consumable bought only in the app; before this view
  // replaced the paywall, subscribers reached it from Settings.
  it('offers Lifetime to a subscriber when the screen can sell it', () => {
    const { getByText } = render(
      <SupporterThanks state={base} today="2026-12-20" onClose={noop} onManage={noop} onGetLifetime={noop} />,
    );
    getByText('Get Lifetime');
    // Buying Lifetime does not cancel a running subscription; say so.
    getByText(/does not cancel your current subscription/);
  });
  it('does not offer Lifetime to a lifetime owner, or when it cannot be sold', () => {
    const owner = render(
      <SupporterThanks state={{ ...base, type: 'lifetime', willRenew: false }} today="2026-12-20" onClose={noop} onManage={noop} onGetLifetime={noop} />,
    );
    expect(owner.queryByText('Get Lifetime')).toBeNull();
    const unsold = render(<SupporterThanks state={base} today="2026-12-20" onClose={noop} onManage={noop} />);
    expect(unsold.queryByText('Get Lifetime')).toBeNull();
  });
});
