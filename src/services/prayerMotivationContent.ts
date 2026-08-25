/**
 * prayerMotivationContent — rotating notification body copy for the five
 * daily prayer alerts, replacing the flat "It's time for the X prayer in
 * {city}" line with something specific to each prayer's own character
 * (Fajr's discipline, Dhuhr's midday reset, Asr's easy-to-lose afternoon,
 * Maghrib's threshold gratitude, Isha's stillness).
 *
 * No Quran/Hadith text or attribution here — this is app-authored
 * motivational copy, not a citation surface, so the sourcing rules in
 * CLAUDE.md ("Citing Hadith") don't apply. Keep it that way; don't let a
 * future edit slip in an unverified "The Prophet ﷺ said..." line.
 *
 * Rotation is deterministic by day-of-year modulo pool size — same
 * technique as dailyGuidanceContent.ts — so every user sees the same
 * variant on the same day and it stays predictable for debugging.
 */
import { dayOfYear } from '../utils/date';

export type Salah = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

const POOL: Record<Salah, string[]> = {
  Fajr: [
    'The world is still asleep. This is your quiet moment alone with Allah before the day even begins.',
    'Before the world wakes up, you already chose Him.',
    "Rise while it's hard — He sees the ones who show up before the sun does.",
    "It's still dark outside. This is when your conversation with Him begins.",
  ],
  Dhuhr: [
    'Step out of the noise for a few minutes. Dhuhr is your reset button.',
    'Whatever the morning demanded, it can wait a few more minutes.',
    'The busiest part of your day is exactly when you need this most.',
    'A short prayer, a long relief. Take both.',
  ],
  Asr: [
    "This is the prayer the afternoon likes to steal. Don't let it take your time with Allah too.",
    'Whatever has pulled your attention today, turning back to Him is worth stepping away for.',
    'The day is quietly slipping past. Pause here and remember who it belongs to.',
    'Afternoons get busy. Let this be the moment you come back to Him anyway.',
  ],
  Maghrib: [
    "The sun is setting on a day you were given. Say thank you before it's gone.",
    'Light is leaving the sky. Let this be how you close the day well.',
    'Whatever today held, it ends here — in a few quiet minutes of thanks.',
    'Day and night meet right now. A good moment to meet your Lord too.',
  ],
  Isha: [
    'The night is quiet now. So is this — just you, Him, and a few minutes of peace.',
    'Before you sleep, come back to Him one more time tonight.',
    'This is the last door of the day. Walk through it toward Allah before you close it.',
    "Whatever today asked of you, it's done now. One more quiet word with your Lord before you rest.",
  ],
};

/**
 * Returns this prayer's motivational body text for the given scheduled
 * date. `date` drives the rotation (not "today") because prayer
 * notifications are scheduled up to 7 days ahead — each of those future
 * days needs its own variant, not whatever day the scheduling call ran on.
 */
export function getPrayerMotivationBody(prayer: Salah, date: Date): string {
  const pool = POOL[prayer];
  return pool[dayOfYear(date) % pool.length];
}
