/**
 * What the square Home Screen widget shows, and every fixed word on it.
 *
 * Spec: docs/superpowers/specs/2026-11-11-square-widget-design.md ("States",
 * "Copy"). The widget (targets/live-activity/PathWidgetView.swift) holds no
 * rules of its own: it draws the `WidgetState` it is handed, text included.
 * So this file is the single place the rules live, and it is plain
 * TypeScript under Jest because the Swift cannot be compiled or run on the
 * development machine.
 *
 * Three things here are not style choices:
 *
 * - Verse and question text passes through UNCHANGED. Nothing in this file
 *   trims, slices or normalises it (CLAUDE.md, "Quoting Quran Text"). Whether
 *   it fits the square is the widget's job, and when it does not fit the
 *   widget shows `fallback` instead of a shortened text.
 * - Nothing asks anything of the user after Dhuhr. The check-in question is a
 *   morning state only; an unanswered question left up all day turns into a
 *   reminder that they did not do it.
 * - No string says or implies that the user missed, skipped or failed
 *   something. WIDGET_COPY is the complete list of fixed strings; do not add
 *   a Divine Name, a verse fragment or a hadith to it. Everything sacred on
 *   the widget arrives whole from the app's verified data.
 */
import type { CardVerse } from '../liveActivity/verseSnapshot';

export const WIDGET_COPY = {
  lockedKicker: 'Sakina Pro',
  lockedText: 'Your day with Sakina, on your Home Screen.',
  checkin: 'How is your heart today?',
  checkinSub: 'A verse for how you feel.',
  gentleDay: 'Whenever you are ready, Sakina is here.',
  gentleNight: 'A quiet moment with Allah before you sleep.',
  journeyPrivateKicker: 'Your Journey',
  journeyPrivateTitle: "Today's step is ready.",
  verseKicker: 'Your verse today',
  reflectDay: 'To carry with you today',
  reflectNight: 'To reflect on tonight',
  verseFallback: 'Your verse is waiting for you.',
  questionFallback: 'A question is waiting for you.',
} as const;

/** What a tap opens. Each must be allowlisted in src/navigation/linking.ts. */
export const WIDGET_URLS = {
  checkIn: 'sakina://check-in',
  pro: 'sakina://pro',
  journey: 'sakina://widget/journey',
  reflect: 'sakina://widget/reflect',
  verse: 'sakina://widget/verse',
} as const;

/**
 * The four stretches of a day, cut at the user's own prayer times:
 * night 00:00–Fajr, morning Fajr–Dhuhr, afternoon Dhuhr–Maghrib,
 * evening Maghrib–24:00.
 */
export type Moment = 'night' | 'morning' | 'afternoon' | 'evening';

/** Everything the widget draws. `ref` is the finished line, dash included. */
export type WidgetState =
  | { kind: 'locked'; kicker: string; text: string; url: string }
  | { kind: 'checkin'; text: string; sub: string; url: string }
  /** No `url`: a tap simply opens Sakina, and nothing is asked. */
  | { kind: 'gentle'; text: string }
  | { kind: 'journey'; kicker: string; dayLabel: string; title: string; day: number; of: number; url: string }
  | { kind: 'verse'; kicker: string; arabic: string; english: string; ref: string; fallback: string; url: string }
  | { kind: 'reflection'; kicker: string; question: string; ref: string; fallback: string; url: string };

export interface WidgetInputs {
  pro: boolean;
  /** The prayer card (island + Lock Screen) is switched on and can run. */
  cardOn: boolean;
  /** `question` is angle.reflection unchanged, or null when the angle has none. */
  checkIn: { dateKey: string; question: string | null; source: string } | null;
  /** The check-in's verse when it was a Quran verse (toCardVerse), else null. */
  mood: CardVerse | null;
  daily: CardVerse[];
  /**
   * `title` / `dayTitle` are null for a sensitive Journey. `day` is the next
   * day to do; `doneOn` the local date of the latest day completion.
   */
  journey: { title: string | null; day: number; of: number; dayTitle: string | null; doneOn: string | null } | null;
}

export const LOCKED_STATE: WidgetState = {
  kind: 'locked',
  kicker: WIDGET_COPY.lockedKicker,
  text: WIDGET_COPY.lockedText,
  url: WIDGET_URLS.pro,
};

function gentle(moment: Moment): WidgetState {
  const night = moment === 'evening' || moment === 'night';
  return { kind: 'gentle', text: night ? WIDGET_COPY.gentleNight : WIDGET_COPY.gentleDay };
}

function journeyState(journey: NonNullable<WidgetInputs['journey']>): WidgetState {
  // Both names or neither: half a sensitive Journey's identity is still its identity.
  const named = journey.title !== null && journey.dayTitle !== null;
  return {
    kind: 'journey',
    kicker: named ? (journey.title as string) : WIDGET_COPY.journeyPrivateKicker,
    dayLabel: `Day ${journey.day} of ${journey.of}`,
    title: named ? (journey.dayTitle as string) : WIDGET_COPY.journeyPrivateTitle,
    day: journey.day,
    of: journey.of,
    url: WIDGET_URLS.journey,
  };
}

/** Today's mood verse if it is a Quran verse chosen this very day, else the daily verse. */
function verseState(inputs: WidgetInputs, dateKey: string, moment: Moment): WidgetState {
  const verse =
    inputs.mood && inputs.mood.dateKey === dateKey
      ? inputs.mood
      : inputs.daily.find((v) => v.dateKey === dateKey) ?? null;
  if (!verse) return gentle(moment);
  return {
    kind: 'verse',
    kicker: WIDGET_COPY.verseKicker,
    arabic: verse.arabic,
    english: verse.english,
    ref: `— ${verse.ref}`,
    fallback: WIDGET_COPY.verseFallback,
    url: WIDGET_URLS.verse,
  };
}

function reflectionState(inputs: WidgetInputs, dateKey: string, moment: Moment): WidgetState {
  const checkIn = inputs.checkIn;
  if (!checkIn || checkIn.question === null) {
    // Nothing to ask. With the card off nothing else shows the verse, so the
    // widget does; with it on, the verse is already on the island.
    return inputs.cardOn ? gentle(moment) : verseState(inputs, dateKey, moment);
  }
  const night = moment === 'evening' || moment === 'night';
  return {
    kind: 'reflection',
    kicker: night ? WIDGET_COPY.reflectNight : WIDGET_COPY.reflectDay,
    question: checkIn.question,
    ref: `— on ${checkIn.source}`,
    fallback: WIDGET_COPY.questionFallback,
    url: WIDGET_URLS.reflect,
  };
}

/**
 * The state for one moment of one local day. First match wins; the order is
 * the spec's table and the comments carry its row numbers.
 */
export function widgetStateFor(inputs: WidgetInputs, dateKey: string, moment: Moment): WidgetState {
  if (!inputs.pro) return LOCKED_STATE; // 1

  const night = moment === 'evening' || moment === 'night';
  const checkedIn = inputs.checkIn !== null && inputs.checkIn.dateKey === dateKey;
  // A Journey day finished today is not "showing": the widget moves on and
  // never says the day is done or not done.
  const journey = inputs.journey && inputs.journey.doneOn !== dateKey && !night ? inputs.journey : null;

  if (!checkedIn) {
    if (moment === 'morning') {
      return { kind: 'checkin', text: WIDGET_COPY.checkin, sub: WIDGET_COPY.checkinSub, url: WIDGET_URLS.checkIn }; // 2
    }
    return journey ? journeyState(journey) : gentle(moment); // 3, 4, 5
  }

  if (night) return reflectionState(inputs, dateKey, moment); // 6
  // Before the Journey on purpose: with the card off, the verse just received
  // stays until Dhuhr, then the Journey takes over.
  if (!inputs.cardOn && moment === 'morning') return verseState(inputs, dateKey, moment); // 7
  if (journey) return journeyState(journey); // 8
  if (!inputs.cardOn) return verseState(inputs, dateKey, moment); // 9
  return reflectionState(inputs, dateKey, moment); // 10
}
