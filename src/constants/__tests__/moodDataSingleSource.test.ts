/**
 * The nine moods must be described in exactly ONE place.
 *
 * They were described in three, and the file that was supposed to be canonical
 * said so in its own header: "This is NOT actually imported by HomeScreen's
 * SmartMoodGrid or MoodCheckInModal — both of those hardcode their own separate
 * mood arrays... the Arabic word for 'Lonely' had quietly drifted apart as a
 * result (وَحْدَة here vs وَحْشَة in the other two, fixed 2026-08-23). Keep the
 * Arabic field here in sync with MoodCheckInModal's GRID_MOODS by hand until
 * these are actually consolidated onto one shared source."
 *
 * Hand-syncing three tables is not a policy, it is a countdown. By the time
 * this test was written the copies had drifted again in four separate ways:
 * `Calm` rendered as "CALM" on one screen and "PEACEFUL" on the other two;
 * `Guilty` carried تَوْبَة in one table and نَدَم · تَوْبَة in another; the
 * sublabel meant three different things (a poetic sentence, an emotional theme,
 * and a transliteration); and the ORDER differed — moodData ran …Tired, Sad,
 * Angry, Lonely while both grids ran …Tired, Lonely, Sad, Angry. A user meeting
 * two of these surfaces in one session met two different products, which is the
 * internal half of Jakob's law.
 *
 * WHAT THIS DOES NOT CATCH: whether the copy is any good; whether
 * `transliteration` actually transliterates `arabic` (a human has to read that —
 * see the comment in moodData.ts about Sukoon/Sakeenah and Ghamm/Irhaq, two
 * pairings that were wrong precisely because nothing mechanical could see it);
 * a fourth table that invents its OWN Arabic rather than copying these strings;
 * and anything about how the entries are rendered.
 */
import { MOOD_VISUALS, MOOD_VISUAL_MAP } from '../moodData';
import { MoodColors } from '../../theme/DesignSystem';
import { readFileSync, globSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../../..');

/** Every member of the `Mood` union in src/types/index.ts. */
const MOODS = [
  'Overwhelmed',
  'Sad',
  'Angry',
  'Tired',
  'Lonely',
  'Grateful',
  'Hopeful',
  'Guilty',
  'Calm',
] as const;

describe('mood data has one source', () => {
  it('covers every mood in the union exactly once', () => {
    expect(MOOD_VISUALS).toHaveLength(MOODS.length);
    for (const mood of MOODS) {
      expect(MOOD_VISUAL_MAP.get(mood)).toBeDefined();
    }
    const keys = MOOD_VISUALS.map((m) => m.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('carries every field its consumers need, so none of them has to keep a copy', () => {
    for (const m of MOOD_VISUALS) {
      // The check-in modal needs a theme, the Home grid needs a transliteration,
      // and MoodSelectionScreen needs the sentence. All three, or a consumer
      // will re-hardcode the one it is missing — which is how this started.
      expect(typeof m.theme).toBe('string');
      expect(m.theme.length).toBeGreaterThan(0);
      expect(typeof m.transliteration).toBe('string');
      expect(m.transliteration.length).toBeGreaterThan(0);
      expect(m.description.length).toBeGreaterThan(0);
      expect(m.arabic.length).toBeGreaterThan(0);
      expect(MoodColors[m.key]).toBeDefined();
    }
  });

  it('stores labels in Title Case so a screen can choose its own casing', () => {
    // Storing 'GRATEFUL' forces every other surface either to shout or to
    // re-type the word. Casing is presentation: textTransform belongs in a
    // style, not in the data.
    for (const m of MOOD_VISUALS) {
      expect(m.label).not.toBe(m.label.toUpperCase());
    }
  });

  it('is the only file in src/ that spells out the mood words in Arabic', () => {
    const arabicByMood = new Map(MOOD_VISUALS.map((m) => [m.arabic, m.key]));
    const files = globSync('src/**/*.{ts,tsx}', { cwd: ROOT })
      .map((f) => f.replace(/\\/g, '/'))
      .filter((f) => !f.includes('__tests__') && f !== 'src/constants/moodData.ts');

    const offenders: string[] = [];
    for (const rel of files) {
      const src = readFileSync(path.join(ROOT, rel), 'utf8');
      for (const [arabic, mood] of arabicByMood) {
        if (src.includes(arabic)) offenders.push(`${rel} hardcodes ${mood} (${arabic})`);
      }
    }

    // HomeScreen glosses Guilty as تَوْبَة in prose and quranData.ts is full of
    // scripture; neither is a mood table. Only the mood surfaces are in scope.
    const moodSurfaces = offenders.filter(
      (o) => o.startsWith('src/components/home/') || o.startsWith('src/screens/'),
    );
    expect(moodSurfaces).toEqual([]);
  });
});
