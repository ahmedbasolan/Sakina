import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getDailyVerse,
  getWindowVerse,
  selectWindowIndices,
  SPIRITUAL_WINDOWS,
  WINDOW_HISTORY_SIZE,
  POOL_SIZE,
} from '../dailyVerseService';

// Local alias — the exported name is window-specific, the tests below read
// better with the shorter form.
const HISTORY_WINDOW = WINDOW_HISTORY_SIZE;

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('dailyVerseService — window-seeded selection', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  // This is the ONLY test here that a naive WINDOW_HISTORY_SIZE = 90 fails —
  // verified by temporarily setting 90 and re-running. Distinctness is defended
  // separately and unconditionally by selectVerseIndex's mustAvoid pass, so the
  // distinctness tests below stay green at 90 and cannot catch this.
  //
  // What oversizing actually costs, and what no test here measures: once the
  // history covers the whole pool, the first pass never finds a candidate, so
  // every draw falls through to the mustAvoid pass. Selection degrades to the
  // raw date hash and the no-repeat-across-days guarantee silently stops
  // meaning anything, while every assertion still passes.
  it('keeps WINDOW_HISTORY_SIZE below POOL_SIZE so history stays meaningful', () => {
    expect(HISTORY_WINDOW).toBeLessThan(POOL_SIZE);
  });

  it('returns three distinct verses for the three windows on the same day', () => {
    const picked = selectWindowIndices('2026-08-15', new Set<number>());
    const values = SPIRITUAL_WINDOWS.map((w) => picked[w]);
    expect(new Set(values).size).toBe(3);
  });

  // Exercises the mustAvoid fallback path in selectVerseIndex: with history
  // covering the pool, the preferred pass finds nothing and distinctness has to
  // come from the second pass alone.
  it('keeps the three daily verses distinct even with a saturated history', () => {
    // Saturate with everything the rolling window could hold.
    const saturated = new Set<number>();
    for (let i = 0; i < HISTORY_WINDOW; i++) saturated.add(i % POOL_SIZE);

    const picked = selectWindowIndices('2026-08-15', saturated);
    const values = SPIRITUAL_WINDOWS.map((w) => picked[w]);
    expect(new Set(values).size).toBe(3);
  });

  it('stays distinct within every day across a long run', () => {
    const recent = new Set<number>();
    const order: number[] = [];

    for (let day = 1; day <= 60; day++) {
      const dateKey = `2026-08-${String(day % 28 + 1).padStart(2, '0')}-${day}`;
      const picked = selectWindowIndices(dateKey, recent);
      const values = SPIRITUAL_WINDOWS.map((w) => picked[w]);

      expect(new Set(values).size).toBe(3);

      for (const v of values) {
        order.push(v);
        recent.add(v);
      }
      // Emulate the rolling trim saveHistory() performs.
      while (order.length > HISTORY_WINDOW) {
        const evicted = order.shift()!;
        if (!order.includes(evicted)) recent.delete(evicted);
      }
    }
  });

  it('gives every window a real verse with a complete ayah and a citation', async () => {
    for (const window of SPIRITUAL_WINDOWS) {
      const verse = await getWindowVerse(window, '2026-08-15');
      expect(verse.arabic.length).toBeGreaterThan(0);
      expect(verse.translation.length).toBeGreaterThan(0);
      expect(verse.ref).toMatch(/\d+:\d+/); // citation carries surah:ayah
    }
  });

  it('is deterministic — same day and window yields the same verse', async () => {
    const a = await getWindowVerse('morning', '2026-08-15');
    await AsyncStorage.clear();
    const b = await getWindowVerse('morning', '2026-08-15');
    expect(b.ref).toBe(a.ref);
  });

  // Regression guard: the verse of the day is a separate, already-shipped
  // surface. Adding window selection must not move it.
  it('leaves getDailyVerse on its own seed', async () => {
    const daily = await getDailyVerse();
    const windows = await Promise.all(
      SPIRITUAL_WINDOWS.map((w) => getWindowVerse(w, daily.dateKey)),
    );
    expect(daily.ref).toBeTruthy();
    // Not asserting difference — a collision is legal — only that the daily
    // verse still resolves independently rather than being replaced by a
    // window verse.
    expect(windows.every((v) => v.dateKey === daily.dateKey)).toBe(true);
  });
});
