/**
 * Shared prayer-context label utilities.
 *
 * Single source of truth for display names and action labels keyed on
 * PrayerContext. Previously duplicated verbatim between HomeScreen.tsx
 * and SpiritualWindowBanner.tsx — any label change now only needs one edit.
 */
import { PrayerContext } from '../types';

export function getSpiritualWindowName(context: PrayerContext): string {
  switch (context) {
    case 'fajr_pre':    return 'The Deep Night (Tahajjud)';
    case 'fajr_post':   return 'The Morning Light';
    case 'dhuhr':       return 'The High Zenith';
    case 'asr':         return 'The Golden Hour';
    case 'maghrib_pre': return 'The Approach of Night';
    case 'maghrib_post': return 'The Evening Glow';
    case 'isha':        return 'The Peace of Night';
    default:            return 'A Moment of Reflection';
  }
}

export function getSpiritualActionText(context: PrayerContext): string {
  switch (context) {
    case 'fajr_pre':    return 'Guided Tahajjud Reflection';
    case 'fajr_post':   return 'Morning Protection Adhkar';
    case 'dhuhr':       return 'Mid-day Spiritual Break';
    case 'asr':         return 'The Golden Hour Remembrance';
    case 'maghrib_pre': return 'Evening Protection Adhkar';
    case 'maghrib_post': return 'Post-Maghrib Gratitude';
    case 'isha':        return 'Nightly Habit & Reflection';
    default:            return 'Explore Guidance';
  }
}
