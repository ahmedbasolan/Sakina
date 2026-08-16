/**
 * Lock Screen Verses — preferences and notification payload.
 *
 * Premium users receive a verse at each of the three spiritual windows, over a
 * curated background photo. See docs/superpowers/specs/2026-08-15-lockscreen-verses-design.md.
 *
 * The attachment is the chosen photo as a bundled asset, NOT a rendered card.
 * Baking the verse into an image needs captureRef, which requires a mounted
 * view and therefore cannot run inside the background task that re-schedules
 * notifications — a render-per-notification design breaks the moment the app
 * is not foregrounded.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Asset } from 'expo-asset';

import {
  DailyVerse,
  SpiritualWindow,
  SPIRITUAL_WINDOWS,
  getWindowVerse,
} from './dailyVerseService';
import { BACKGROUND_THEMES, backgroundThemeService } from './backgroundThemeService';
import { logServiceError } from './errorLoggingService';

const PREFS_KEY = '@lockscreen_verses';

export interface LockscreenVersePrefs {
  /** Master switch. Off means the spiritual reminders keep their static copy. */
  enabled: boolean;
  /** Per-window opt-out. Tahajjud fires ~1h before Fajr and some users want only the other two. */
  windows: Record<SpiritualWindow, boolean>;
  /** Background theme id. Null falls back to the globally selected ShareSheet theme. */
  themeId: string | null;
  showTransliteration: boolean;
}

export const DEFAULT_LOCKSCREEN_PREFS: LockscreenVersePrefs = {
  enabled: false,
  windows: { tahajjud: true, morning: true, evening: true },
  themeId: null,
  showTransliteration: false,
};

/** Titles stay the ones already shipped, so the voice does not shift. */
export const WINDOW_TITLES: Record<SpiritualWindow, string> = {
  tahajjud: 'The Silent Hour',
  morning: 'Start with Light',
  evening: 'Closing the Day',
};

export async function loadLockscreenPrefs(): Promise<LockscreenVersePrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_LOCKSCREEN_PREFS };
    const parsed = JSON.parse(raw);
    // Merge over defaults rather than trusting the stored shape — an install
    // that predates a new window would otherwise yield `undefined` for it and
    // silently disable that window.
    return {
      ...DEFAULT_LOCKSCREEN_PREFS,
      ...parsed,
      windows: { ...DEFAULT_LOCKSCREEN_PREFS.windows, ...(parsed?.windows ?? {}) },
    };
  } catch {
    return { ...DEFAULT_LOCKSCREEN_PREFS };
  }
}

export async function saveLockscreenPrefs(
  patch: Partial<LockscreenVersePrefs>,
): Promise<LockscreenVersePrefs> {
  const current = await loadLockscreenPrefs();
  const next: LockscreenVersePrefs = {
    ...current,
    ...patch,
    windows: { ...current.windows, ...(patch.windows ?? {}) },
  };
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  return next;
}

/**
 * Clear the lock screen preference when premium lapses.
 *
 * Mirrors ShareSheet's discipline of resetting the premium photo theme the
 * moment isPremium turns false, so a lapsed user is not left with a premium
 * background quietly still selected.
 */
export async function resetLockscreenPrefsOnLapse(): Promise<void> {
  await saveLockscreenPrefs({ enabled: false, themeId: null });
}

/**
 * Build the notification body for a verse.
 *
 * Carries the COMPLETE ayah. iOS collapses a long body to a few lines and
 * expands it on tap, which is the permitted preview-then-expand pattern — the
 * whole ayah stays reachable. Never truncate here.
 */
export function buildVerseBody(verse: DailyVerse, showTransliteration: boolean): string {
  const parts = [verse.arabic];
  if (showTransliteration && verse.transliteration) parts.push(verse.transliteration);
  parts.push(verse.translation);
  parts.push(`— ${verse.ref}`);
  return parts.join('\n\n');
}

/**
 * Resolve the background photo to a local file URI for the notification
 * attachment. Returns null when unavailable, which is not an error — the
 * notification still delivers with text only.
 */
export async function resolveThemeAttachment(themeId: string | null): Promise<string | null> {
  try {
    // Three tiers: the lock screen's own choice, then the theme already
    // selected for share cards, then simply the first theme. Without that last
    // tier a user who never opened the theme picker would get verse
    // notifications with no photo and no indication why.
    //
    // The final tier is NOT filtered to free themes: all 28 entries in
    // BACKGROUND_THEMES are isPremium: true — there are no free ones — and this
    // whole feature is premium-gated anyway, so the user is entitled to any of
    // them. (An earlier draft of the spec said "6 free themes"; that was
    // THEME_CATEGORIES being miscounted as themes.)
    const theme =
      (themeId ? BACKGROUND_THEMES.find((t) => t.id === themeId) : null) ??
      (await backgroundThemeService.getSelectedTheme()) ??
      BACKGROUND_THEMES[0] ??
      null;
    if (!theme) return null;

    const asset = Asset.fromModule(theme.imageSource as number);
    if (!asset.localUri) await asset.downloadAsync();
    return asset.localUri ?? null;
  } catch (error) {
    logServiceError(
      'LockscreenVerseService',
      'resolveThemeAttachment',
      error instanceof Error ? error : new Error(String(error)),
    );
    return null;
  }
}

/** YYYY-MM-DD in local time, matching dailyVerseService's key format. */
function dateKeyOf(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Notification content for one window on one date, or null when this window
 * should keep its existing static copy (feature off, or window opted out).
 */
export async function buildWindowContent(
  window: SpiritualWindow,
  date: Date,
  prefs: LockscreenVersePrefs,
): Promise<Notifications.NotificationContentInput | null> {
  if (!prefs.enabled) return null;
  if (!prefs.windows[window]) return null;

  const verse = await getWindowVerse(window, dateKeyOf(date));

  const content: Notifications.NotificationContentInput = {
    title: WINDOW_TITLES[window],
    body: buildVerseBody(verse, prefs.showTransliteration),
    sound: true,
  };

  // Attachments are genuinely iOS-only, confirmed by reading the native
  // Android builder (expo-notifications 0.32.17): for a LOCALLY scheduled
  // notification it always renders NotificationCompat.BigTextStyle and its
  // getImage() only reads a static AndroidManifest large-icon meta-data key,
  // never anything from this call's content. There is no per-notification
  // image on Android without a native module — not a config gap, an API gap.
  // The theme is resolved (and its asset downloaded) only when it can matter.
  if (Platform.OS === 'ios') {
    const attachmentUri = await resolveThemeAttachment(prefs.themeId);
    if (attachmentUri) {
      content.attachments = [
        { identifier: `sakina-verse-${window}`, type: 'public.jpeg', url: attachmentUri },
      ];
    }
  }

  return content;
}

export { SPIRITUAL_WINDOWS };
export type { SpiritualWindow };
