/**
 * Who may start which journey, on which day. Pure: every input is a
 * parameter, so PathsScreen, the supporter view and the tests all get the
 * same answer. Data lives in src/constants/journeyAvailability.ts.
 *
 * Dates are LOCAL calendar days (YYYY-MM-DD), compared as strings — the
 * format sorts lexicographically. Never toISOString(): that is UTC and gives
 * the wrong day west of Greenwich after local midnight.
 */
import {
  AVAILABLE_PATHS,
  AVAILABLE_PATH_IDS,
  EARLY_ACCESS_DAYS,
  JourneyRelease,
} from '../constants/journeyAvailability';
import { formatDateYMD, subtractDays } from './date';

export function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** First day everyone may start it; null when it never opens to free. */
export function publicFromYMD(release: JourneyRelease): string | null {
  if (release.access === 'pro_exclusive') return null;
  if (release.access === 'free') return release.released;
  return formatDateYMD(subtractDays(parseYMD(release.released), -EARLY_ACCESS_DAYS));
}

export function formatShortDate(ymd: string): string {
  return parseYMD(ymd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export interface JourneyAccess {
  locked: boolean;
  /** Pill copy. Locked: why. Unlocked: only the Pro early-access marker. */
  label?: string;
  /** Inside its Pro-first window today (regardless of who is looking). */
  inEarlyAccess: boolean;
  /** Tapping it should open the Support screen. */
  routeToPaywall: boolean;
}

export function getJourneyAccess(
  pathId: string,
  opts: { isPremium: boolean; hasProgress: boolean; today: string },
): JourneyAccess {
  if (!AVAILABLE_PATH_IDS.has(pathId)) {
    return { locked: true, label: 'Coming soon', inEarlyAccess: false, routeToPaywall: false };
  }
  const release = AVAILABLE_PATHS[pathId];
  const publicFrom = publicFromYMD(release);
  const inEarlyAccess =
    release.access === 'early_access' && publicFrom !== null && opts.today < publicFrom;
  const gated = release.access === 'pro_exclusive' || inEarlyAccess;

  // Grandfather: progress already made is never taken away, whatever the tier.
  if (!gated || opts.isPremium || opts.hasProgress) {
    return {
      locked: false,
      ...(inEarlyAccess && opts.isPremium ? { label: 'Pro early access' } : {}),
      inEarlyAccess,
      routeToPaywall: false,
    };
  }
  return {
    locked: true,
    label:
      release.access === 'pro_exclusive'
        ? 'Sakina Pro exclusive'
        : `Free from ${formatShortDate(publicFrom!)}`,
    inEarlyAccess,
    routeToPaywall: true,
  };
}
