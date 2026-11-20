/**
 * Keeps the square Home Screen widget current (spec: docs/superpowers/specs/
 * 2026-11-11-square-widget-design.md, "Data: what the app writes for the
 * widget").
 *
 * It gathers the app's state (Pro, the prayer card switch, today's check-in,
 * the running Journey, prayer times), turns it into the widget's 30-day
 * timeline (widgetTimeline.ts) and writes that into the App Group. The widget
 * itself decides nothing.
 *
 * Called fire-and-forget from screens and hooks, so no public method ever
 * throws: failures are logged and swallowed. Every mutating method runs
 * through one promise-chain queue, so a check-in written during a refresh is
 * never overwritten by that refresh's older picture.
 *
 * Kept on the device, never in the App Group: the check-in's full experience
 * and the mood (AsyncStorage `@widget_checkin`), which a tap needs to reopen
 * the same guidance. The App Group only ever receives finished text.
 *
 * Independent of the prayer card's own storage on purpose: the card only
 * remembers a mood verse while it is switched on, and the widget needs it
 * exactly when the card is off.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as native from '../../../modules/sakina-live-activity';
import { AVAILABLE_PATH_IDS } from '../../constants/journeyAvailability';
import { isNamedOnWidget } from '../../constants/journeyPrivacy';
import type { GuidanceExperience, Mood, UserPathProgress } from '../../types';
import { getDailyVerse } from '../dailyVerseService';
import { logServiceError } from '../errorLoggingService';
import { LiveActivityService } from '../liveActivity/liveActivityService';
import { buildSchedule } from '../liveActivity/prayerSchedule';
import { buildVerseSnapshot, toCardVerse, type CardVerse } from '../liveActivity/verseSnapshot';
import { PathsService } from '../pathsService';
import type { PrayerTimings } from '../prayerTimesService';
import { SubscriptionService } from '../subscriptionService';
import type { WidgetInputs } from './widgetState';
import { buildWidgetSnapshot, dateKeyOf, dayTimesFromSchedule, lockedSnapshot, type DayTimes } from './widgetTimeline';

/** Today's check-in: what the widget shows and what a tap reopens. */
export const WIDGET_CHECKIN_KEY = '@widget_checkin';
/** `{ pathId, dateKey }` of the latest Journey day completion. */
export const WIDGET_JOURNEY_DONE_KEY = '@widget_journey_done';
/** `{ firstDay, weekly }`: the week of prayer timings the app last computed. */
export const WIDGET_TIMINGS_KEY = '@widget_timings';
/**
 * 'true' from sign-out / account deletion until a new session starts. While it
 * is set the widget is locked whatever else is true: Journey progress survives
 * sign-out in SQLite and an offline sign-out can leave the cached subscription
 * saying Pro, so without it the next refresh would rebuild the departed
 * account's day onto the Home Screen.
 */
export const WIDGET_FORGOTTEN_KEY = '@widget_forgotten';

const SERVICE = 'WidgetService';

export interface StoredCheckIn {
  dateKey: string;
  mood: Mood;
  experience: GuidanceExperience;
}

interface StoredTimings {
  firstDay: string;
  weekly: PrayerTimings[];
}

async function readJson<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  return raw === null ? null : (JSON.parse(raw) as T);
}

function today(): string {
  return dateKeyOf(new Date());
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export class WidgetService {
  private static instance: WidgetService | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private waitingForLoad = false;

  static getInstance(): WidgetService {
    if (!WidgetService.instance) WidgetService.instance = new WidgetService();
    return WidgetService.instance;
  }

  private constructor() {
    // Pro gained or lost after the first load (purchase, restore, an account
    // change): switch between the locked state and the user's day. Guarded
    // because getInstance() is reached from fire-and-forget call sites and
    // must never throw there.
    try {
      SubscriptionService.getInstance().onPremiumChange(() => {
        void this.refresh();
      });
    } catch (error) {
      logServiceError(SERVICE, 'subscribe', asError(error));
    }
  }

  /** Runs `task` after every previously queued task has settled. Never rejects. */
  private enqueue(step: string, task: () => Promise<void>): Promise<void> {
    const guarded = async () => {
      try {
        await task();
      } catch (error) {
        logServiceError(SERVICE, step, asError(error));
      }
    };
    const run = this.queue.then(guarded, guarded);
    this.queue = run;
    return run;
  }

  /** Gathers the app's state and rewrites the widget's snapshot. */
  refresh(): Promise<void> {
    return this.enqueue('refresh', () => this.write());
  }

  /** A mood check-in showed `experience`: keep it for today, then rewrite. */
  onCheckIn(experience: GuidanceExperience, mood: Mood): Promise<void> {
    return this.enqueue('onCheckIn', async () => {
      if (await this.isForgotten()) {
        native.writeWidgetSnapshot(JSON.stringify(lockedSnapshot()));
        return;
      }
      const stored: StoredCheckIn = { dateKey: today(), mood, experience };
      await AsyncStorage.setItem(WIDGET_CHECKIN_KEY, JSON.stringify(stored));
      await this.write();
    });
  }

  /** A day of `pathId` was completed today: the widget moves on until tomorrow. */
  onJourneyDayCompleted(pathId: string): Promise<void> {
    return this.enqueue('onJourneyDayCompleted', async () => {
      await AsyncStorage.setItem(WIDGET_JOURNEY_DONE_KEY, JSON.stringify({ pathId, dateKey: today() }));
      await this.write();
    });
  }

  /** The week of prayer timings the app just computed, starting today. */
  setTimings(weekly: PrayerTimings[]): Promise<void> {
    return this.enqueue('setTimings', async () => {
      const stored: StoredTimings = { firstDay: today(), weekly };
      await AsyncStorage.setItem(WIDGET_TIMINGS_KEY, JSON.stringify(stored));
      await this.write();
    });
  }

  /**
   * Sign-out / account deletion: remove everything kept here, clear the
   * widget, and keep it locked until `resume()`.
   */
  forget(): Promise<void> {
    return this.enqueue('forget', async () => {
      const results = await Promise.allSettled([
        AsyncStorage.setItem(WIDGET_FORGOTTEN_KEY, 'true'),
        AsyncStorage.removeItem(WIDGET_CHECKIN_KEY),
        AsyncStorage.removeItem(WIDGET_JOURNEY_DONE_KEY),
        AsyncStorage.removeItem(WIDGET_TIMINGS_KEY),
      ]);
      // The native clear runs even when a key could not be removed.
      native.clearWidgetSnapshot();
      for (const result of results) {
        if (result.status === 'rejected') logServiceError(SERVICE, 'forget', asError(result.reason));
      }
    });
  }

  /**
   * A new session started (sign-in, once the app has cleared any other
   * account's local data; or a guest start): lift the `forget()` latch and
   * draw the day again.
   */
  resume(): Promise<void> {
    return this.enqueue('resume', async () => {
      await AsyncStorage.removeItem(WIDGET_FORGOTTEN_KEY);
      await this.write();
    });
  }

  private async isForgotten(): Promise<boolean> {
    try {
      return (await AsyncStorage.getItem(WIDGET_FORGOTTEN_KEY)) === 'true';
    } catch (error) {
      logServiceError(SERVICE, 'isForgotten', asError(error));
      return false;
    }
  }

  /** Today's check-in, or null (none, another day's, or unreadable). */
  async getTodaysCheckIn(): Promise<StoredCheckIn | null> {
    try {
      const stored = await readJson<StoredCheckIn>(WIDGET_CHECKIN_KEY);
      return stored && stored.dateKey === today() ? stored : null;
    } catch (error) {
      logServiceError(SERVICE, 'getTodaysCheckIn', asError(error));
      return null;
    }
  }

  /**
   * The Journey the widget follows: the last opened one if it is still
   * running, else the most recently started running one. "Running" means
   * started, not finished, still available, and its current day exists.
   */
  async getRunningJourney(): Promise<{ pathId: string; progress: UserPathProgress } | null> {
    try {
      const paths = PathsService.getInstance();
      const running = (p: UserPathProgress | null): p is UserPathProgress => {
        if (!p || p.isCompleted || !AVAILABLE_PATH_IDS.has(p.pathId)) return false;
        const path = paths.getPathById(p.pathId);
        return !!path && p.currentDay >= 1 && p.currentDay <= path.duration && !!paths.getCurrentStep(p.pathId, p);
      };

      const lastId = await paths.getLastOpenedPath();
      if (lastId) {
        const last = await paths.loadProgress(lastId);
        if (running(last)) return { pathId: last.pathId, progress: last };
      }
      const all = (await paths.getAllProgress()).filter(running).sort((a, b) => b.startDate - a.startDate);
      return all.length > 0 ? { pathId: all[0].pathId, progress: all[0] } : null;
    } catch (error) {
      logServiceError(SERVICE, 'getRunningJourney', asError(error));
      return null;
    }
  }

  /** Runs inside the queue. */
  private async write(): Promise<void> {
    const sub = SubscriptionService.getInstance();
    if (!sub.hasLoaded()) {
      // Before the subscription loads, isPremium() is false for everyone: a
      // write now would flash a Pro user's widget to Locked. Write once it loads.
      if (!this.waitingForLoad) {
        this.waitingForLoad = true;
        sub.onLoaded(() => {
          this.waitingForLoad = false;
          void this.refresh();
        });
      }
      return;
    }
    if (!sub.isPremium() || (await this.isForgotten())) {
      native.writeWidgetSnapshot(JSON.stringify(lockedSnapshot()));
      return;
    }

    const todayKey = today();
    const inputs = await this.gather(todayKey);
    const real = await this.prayerDays();
    native.writeWidgetSnapshot(JSON.stringify(buildWidgetSnapshot(inputs, todayKey, real)));
  }

  private async gather(todayKey: string): Promise<WidgetInputs> {
    const card = LiveActivityService.getInstance();
    const cardOn = card.isAvailable() && (await card.getEnabled());

    const stored = await this.getTodaysCheckIn();
    const checkIn = stored
      ? {
          dateKey: stored.dateKey,
          // Unchanged; an empty prompt is no prompt.
          question: stored.experience.angle.reflection || null,
          source: stored.experience.content.source,
        }
      : null;
    const mood: CardVerse | null = stored ? toCardVerse(stored.experience.content, stored.dateKey) : null;

    let daily: CardVerse[] = [];
    try {
      daily = buildVerseSnapshot({ mood: null, today: await getDailyVerse(), timeFormat: '24h' }).daily;
    } catch (error) {
      logServiceError(SERVICE, 'dailyVerse', asError(error));
    }

    return { pro: true, cardOn, checkIn, mood, daily, journey: await this.journeyInput() };
  }

  private async journeyInput(): Promise<WidgetInputs['journey']> {
    const running = await this.getRunningJourney();
    if (!running) return null;
    const paths = PathsService.getInstance();
    const path = paths.getPathById(running.pathId);
    const step = paths.getCurrentStep(running.pathId, running.progress);
    if (!path || !step) return null;

    let doneOn: string | null = null;
    try {
      const done = await readJson<{ pathId: string; dateKey: string }>(WIDGET_JOURNEY_DONE_KEY);
      if (done && done.pathId === running.pathId) doneOn = done.dateKey;
    } catch (error) {
      logServiceError(SERVICE, 'journeyDone', asError(error));
    }

    // A sensitive Journey's names never leave this function.
    const named = isNamedOnWidget(running.pathId);
    return {
      title: named ? path.title : null,
      day: running.progress.currentDay,
      of: path.duration,
      dayTitle: named ? step.title : null,
      doneOn,
    };
  }

  private async prayerDays(): Promise<Map<string, DayTimes>> {
    try {
      const stored = await readJson<StoredTimings>(WIDGET_TIMINGS_KEY);
      if (!stored || stored.weekly.length === 0) return new Map();
      const [y, m, d] = stored.firstDay.split('-').map(Number);
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return dayTimesFromSchedule(buildSchedule(stored.weekly, new Date(y, m - 1, d), timeZone));
    } catch (error) {
      logServiceError(SERVICE, 'prayerDays', asError(error));
      return new Map();
    }
  }
}
