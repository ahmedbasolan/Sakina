import { scoreAngle, PRAYER_CONTEXT_BOOST } from '../rotationScoring';
import type { ContentAngle, PrayerContext } from '../../types';

const DAY = 86_400_000;
const NOW = 1_700_000_000_000;

function angle(id: string, prayerContext?: PrayerContext[]): ContentAngle {
  return {
    id,
    contentId: `content_${id}`,
    mood: 'Hopeful',
    angle: 'x',
    reflection: 'y',
    ...(prayerContext ? { content: { prayerContext } } : {}),
  } as unknown as ContentAngle;
}

const NO_HISTORY = new Map<string, number>();

describe('scoreAngle', () => {
  it('defaults to 10 — every angle in the corpus, since moodScores is never set', () => {
    expect(scoreAngle(angle('a'), NO_HISTORY, 'fajr_pre', NOW)).toBe(10);
  });

  describe('recency penalty', () => {
    const cases: [string, number, number][] = [
      ['seen hours ago', 0.5 * DAY, 10 - 15],
      ['seen 2 days ago', 2 * DAY, 10 - 10],
      ['seen 5 days ago', 5 * DAY, 10 - 5],
      ['seen 10 days ago', 10 * DAY, 10],
    ];
    it.each(cases)('%s', (_label, ago, expected) => {
      const a = angle('a');
      const history = new Map([[`${a.contentId}-${a.id}`, NOW - ago]]);
      expect(scoreAngle(a, history, 'fajr_pre', NOW)).toBe(Math.max(1, expected));
    });

    it('floors at 1 rather than going negative', () => {
      const a = angle('a');
      const history = new Map([[`${a.contentId}-${a.id}`, NOW - 1]]);
      expect(scoreAngle(a, history, 'fajr_pre', NOW)).toBeGreaterThanOrEqual(1);
    });
  });

  describe('prayer-context boost', () => {
    it('applies only when the window matches', () => {
      const tagged = angle('a', ['fajr_pre']);
      expect(scoreAngle(tagged, NO_HISTORY, 'fajr_pre', NOW)).toBe(10 + PRAYER_CONTEXT_BOOST);
      expect(scoreAngle(tagged, NO_HISTORY, 'maghrib_pre', NOW)).toBe(10);
    });

    /**
     * The regression this file exists for. The boost was 50, which against a
     * uniform base of 10 gave the two fajr_pre-tagged Hopeful verses 80% of
     * picks — the same two verses every morning.
     *
     * Reproduces the real selection: Hopeful's pool of 24, topN = max(5,
     * ceil(24 * 0.2)) = 5, weighted random over those five.
     */
    it('leaves the rest of the pool reachable at Fajr', () => {
      const pool = [
        angle('tagged1', ['fajr_pre']),
        angle('tagged2', ['fajr_pre']),
        ...Array.from({ length: 22 }, (_, i) => angle(`plain${i}`)),
      ];

      const scored = pool
        .map((a) => ({ id: a.id, score: scoreAngle(a, NO_HISTORY, 'fajr_pre', NOW) }))
        .sort((a, b) => b.score - a.score);

      const topN = Math.max(5, Math.ceil(pool.length * 0.2));
      const top = scored.slice(0, topN);
      const total = top.reduce((s, x) => s + x.score, 0);
      const taggedShare =
        top.filter((x) => x.id.startsWith('tagged')).reduce((s, x) => s + x.score, 0) / total;

      // Favoured, but not the near-certainty the +50 produced.
      expect(taggedShare).toBeLessThan(0.6);
      expect(taggedShare).toBeGreaterThan(0.3);
    });

    it('would have been near-deterministic at the old +50', () => {
      const OLD = 50;
      const top = [10 + OLD, 10 + OLD, 10, 10, 10];
      const share = (2 * (10 + OLD)) / top.reduce((s, x) => s + x, 0);
      expect(share).toBeCloseTo(0.8, 2);
      expect(share).toBeGreaterThan(0.6); // the threshold the new value must clear
    });
  });
});
