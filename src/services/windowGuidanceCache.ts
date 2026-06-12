/**
 * windowGuidanceCache — remembers the last guidance experience delivered for
 * each (prayer window, mood), so a free user re-tapping a mood on Home returns
 * to the verse they already received instead of minting a fresh one. Fresh
 * guidance flows only through the gated refresh budget (spec §3.2); without
 * this cache, repeated Home check-ins bypassed the three-refreshes-per-window
 * limit entirely and wrote duplicate mood-history rows.
 *
 * Premium users and mercy moods are never cached — they get fresh guidance by
 * design, so callers must check those cases before consulting this module.
 *
 * Persisted to AsyncStorage so an app restart mid-window can't reset the
 * window's delivery. Only one window is ever stored: writing under a new
 * windowKey discards the previous window's entries.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GuidanceExperience, Mood } from '../types';

const STORAGE_KEY = '@sakina_window_guidance';

interface WindowCache {
  windowKey: string; // `${YYYY-MM-DD}:${PrayerContext}` from SessionService
  byMood: Partial<Record<Mood, GuidanceExperience>>;
}

let memory: WindowCache | null = null;
let loaded = false;

async function load(): Promise<WindowCache | null> {
  if (loaded) return memory;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    memory = raw ? (JSON.parse(raw) as WindowCache) : null;
  } catch {
    memory = null;
  }
  loaded = true;
  return memory;
}

/** The experience already delivered this window for this mood, if any. */
export async function getCachedGuidance(
  windowKey: string,
  mood: Mood,
): Promise<GuidanceExperience | null> {
  const cache = await load();
  if (!cache || cache.windowKey !== windowKey) return null;
  return cache.byMood[mood] ?? null;
}

/**
 * Record the latest delivered experience for this window+mood (re-entry should
 * land on the most recent verse, so "next" advances overwrite earlier ones).
 */
export async function setCachedGuidance(
  windowKey: string,
  mood: Mood,
  experience: GuidanceExperience,
): Promise<void> {
  const cache = await load();
  const next: WindowCache =
    cache && cache.windowKey === windowKey ? cache : { windowKey, byMood: {} };
  next.byMood[mood] = experience;
  memory = next;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Memory copy still serves this session; worst case a restart re-fetches once.
  }
}

/** Test-only: reset module state between cases. */
export function __resetWindowGuidanceCacheForTests(): void {
  memory = null;
  loaded = false;
}
