import { getPrayerMotivationBody, Salah } from '../prayerMotivationContent';

const SALAH: Salah[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

describe('getPrayerMotivationBody', () => {
  it('returns a non-empty string for every prayer across a range of dates', () => {
    for (const prayer of SALAH) {
      for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
        const date = new Date(2026, 0, 1 + dayOffset);
        const body = getPrayerMotivationBody(prayer, date);
        expect(typeof body).toBe('string');
        expect(body.length).toBeGreaterThan(0);
      }
    }
  });

  it('is deterministic — the same prayer and date always return the same line', () => {
    const date = new Date(2026, 3, 12);
    for (const prayer of SALAH) {
      const first = getPrayerMotivationBody(prayer, date);
      const second = getPrayerMotivationBody(prayer, date);
      expect(second).toBe(first);
    }
  });

  it('rotates — the same prayer varies its line across different days', () => {
    // Sampling 10 consecutive days must not collapse to a single repeated
    // line; that would mean the rotation silently stopped varying (e.g. a
    // pool that shrank to one entry, or a broken modulo).
    for (const prayer of SALAH) {
      const bodies = new Set(
        Array.from({ length: 10 }, (_, i) => getPrayerMotivationBody(prayer, new Date(2026, 0, 1 + i))),
      );
      expect(bodies.size).toBeGreaterThan(1);
    }
  });

  it('gives each prayer its own distinct set of lines — no cross-prayer bleed', () => {
    // Collect every line each prayer produces over a full rotation cycle and
    // confirm no two prayers ever share a line — a copy-paste from one
    // prayer's pool into another's would show up as an intersection here.
    const linesByPrayer = SALAH.map((prayer) => {
      const lines = new Set<string>();
      for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
        lines.add(getPrayerMotivationBody(prayer, new Date(2026, 0, 1 + dayOffset)));
      }
      return lines;
    });

    for (let i = 0; i < linesByPrayer.length; i++) {
      for (let j = i + 1; j < linesByPrayer.length; j++) {
        const intersection = [...linesByPrayer[i]].filter((line) => linesByPrayer[j].has(line));
        expect(intersection).toEqual([]);
      }
    }
  });

  it('is unaffected by time-of-day — same calendar day picks the same line', () => {
    for (const prayer of SALAH) {
      const morning = getPrayerMotivationBody(prayer, new Date(2026, 5, 15, 5, 0));
      const night = getPrayerMotivationBody(prayer, new Date(2026, 5, 15, 23, 30));
      expect(morning).toBe(night);
    }
  });
});
