/**
 * App-side orchestrator for the Pro-only prayer Live Activity (iOS).
 *
 * Called fire-and-forget from hooks, so no public method ever throws: failures
 * are logged and swallowed. Everything is a no-op where the native module is
 * absent (Android, Jest, older iOS).
 *
 * Every mutating public method runs through one promise-chain queue, so a
 * switch-off or account wipe can never interleave with a sync that is still
 * awaiting something (which would re-register a device the user just removed),
 * and a verse shown during a sync is never overwritten by that sync's snapshot.
 *
 * Privacy: the register payload carries prayer INSTANTS (epoch seconds), the
 * IANA time zone and ids only — never coordinates, a city, the mood or any
 * verse text. Verse text lives in the on-device snapshot and nowhere else.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import * as native from '../../../modules/sakina-live-activity';
import { supabase } from '../../config/supabaseClient';
import type { Content } from '../../types';
import { getDailyVerse, formatDateKey } from '../dailyVerseService';
import { logServiceError } from '../errorLoggingService';
import type { PrayerTimings } from '../prayerTimesService';
import { SubscriptionService } from '../subscriptionService';
import { buildSchedule } from './prayerSchedule';
import { buildVerseSnapshot, toCardVerse, type CardVerse } from './verseSnapshot';

export const LIVE_ACTIVITY_PREF_KEY = '@live_activity_enabled';
export const LIVE_ACTIVITY_INVITE_KEY = '@live_activity_invite_seen';
/** The mood-picked verse for the card, kept until its own day ends. */
export const LIVE_ACTIVITY_MOOD_VERSE_KEY = '@live_activity_mood_verse';
/**
 * Set after a successful register, cleared by `disableAndForget`. A user who
 * never opted in has no registration to remove, so teardown must not mint a
 * device id or call the server for them.
 */
export const LIVE_ACTIVITY_REGISTERED_KEY = '@live_activity_registered';
/** Last clock format `sync` saw, so `onVerseShown` can rewrite the snapshot. */
const LIVE_ACTIVITY_TIME_FORMAT_KEY = '@live_activity_time_format';

const REGISTER_FUNCTION = 'live-activity-register';
const SERVICE = 'LiveActivityService';

type TimeFormat = '12h' | '24h';
/** `unloaded` = subscription state not resolved yet: not the same as "not Pro". */
type ProState = 'unloaded' | 'pro' | 'notPro';

function proState(): ProState {
  const sub = SubscriptionService.getInstance();
  if (!sub.hasLoaded()) return 'unloaded';
  return sub.isPremium() ? 'pro' : 'notPro';
}

export class LiveActivityService {
  private static instance: LiveActivityService | null = null;
  private queue: Promise<unknown> = Promise.resolve();

  static getInstance(): LiveActivityService {
    if (!LiveActivityService.instance) {
      LiveActivityService.instance = new LiveActivityService();
    }
    return LiveActivityService.instance;
  }

  /** Runs `task` after every previously queued task has settled. Never rejects. */
  private enqueue(task: () => Promise<void>): Promise<void> {
    const run = this.queue.then(task, task);
    this.queue = run;
    return run;
  }

  isAvailable(): boolean {
    try {
      return native.isSupported();
    } catch {
      return false;
    }
  }

  async getEnabled(): Promise<boolean> {
    try {
      return (await AsyncStorage.getItem(LIVE_ACTIVITY_PREF_KEY)) === 'true';
    } catch {
      return false;
    }
  }

  setEnabled(value: boolean): Promise<void> {
    return this.enqueue(async () => {
      try {
        await AsyncStorage.setItem(LIVE_ACTIVITY_PREF_KEY, value ? 'true' : 'false');
        if (!value) await this.teardown();
      } catch (error) {
        logServiceError(SERVICE, 'setEnabled', error as Error);
      }
    });
  }

  /**
   * Brings the device and the server in line with the current switch + Pro
   * state. `weekly` is the app's local-time weekly timings, day 0 = today.
   *
   * Only an explicit switch-off or a LOADED non-Pro state tears down; while the
   * subscription state is still loading this does nothing at all.
   */
  sync(weekly: PrayerTimings[], timeFormat: TimeFormat): Promise<void> {
    return this.enqueue(async () => {
      try {
        if (!this.isAvailable()) return;

        if (!(await this.getEnabled())) {
          await this.teardown();
          return;
        }
        const state = proState();
        if (state === 'unloaded') return;
        if (state === 'notPro') {
          await this.teardown();
          return;
        }

        const nativeConfig = {
          registerUrl: `${SUPABASE_URL || ''}/functions/v1/${REGISTER_FUNCTION}`,
          anonKey: SUPABASE_ANON_KEY || '',
        };
        native.configure(nativeConfig);

        await AsyncStorage.setItem(LIVE_ACTIVITY_TIME_FORMAT_KEY, timeFormat);
        await this.writeSnapshot(timeFormat);

        const now = new Date();
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const schedule = buildSchedule(weekly, now, timeZone);
        const rcAppUserId = await Purchases.getAppUserID();

        // The awaits above are a window in which the switch or the
        // subscription can change; never register on a stale decision.
        if (!(await this.stillAllowed())) return;

        const { error } = await supabase.functions.invoke(REGISTER_FUNCTION, {
          body: {
            action: 'register',
            deviceId: native.getDeviceId(),
            rcAppUserId,
            apnsEnv: __DEV__ ? 'sandbox' : 'production',
            timeZone,
            schedule,
          },
        });
        if (error) {
          logServiceError(SERVICE, 'sync.register', error as Error);
        } else {
          await AsyncStorage.setItem(LIVE_ACTIVITY_REGISTERED_KEY, 'true');
          // The server row exists now. Native token posts made before this
          // (getDeviceId reposts on first call, racing the register above) were
          // answered 409 or lost, so configure again: it makes the forwarder
          // repost its current tokens against the new row.
          native.configure(nativeConfig);
        }

        if (!(await this.stillAllowed())) {
          // We just registered on a decision that has since flipped: undo it.
          await this.teardown();
          return;
        }

        const nowS = now.getTime() / 1000;
        const next = schedule.find((p) => p.at > nowS);
        if (next) await native.startLocal(next.name, next.at);
      } catch (error) {
        logServiceError(SERVICE, 'sync', error as Error);
      }
    });
  }

  /** A verse was shown for the user's mood: remember it for the card (Quran only). */
  onVerseShown(content: Content): Promise<void> {
    return this.enqueue(async () => {
      try {
        if (!this.isAvailable()) return;
        if (!(await this.stillAllowed())) return;

        const verse = toCardVerse(content, formatDateKey(new Date()));
        if (!verse) return;

        await AsyncStorage.setItem(LIVE_ACTIVITY_MOOD_VERSE_KEY, JSON.stringify(verse));
        await this.writeSnapshot(await this.readTimeFormat());
      } catch (error) {
        logServiceError(SERVICE, 'onVerseShown', error as Error);
      }
    });
  }

  /**
   * Switch off / lost Pro / account wipe: remove everything the feature put on
   * the device and tell the server to stop pushing.
   */
  disableAndForget(): Promise<void> {
    return this.enqueue(() => this.teardown());
  }

  /** Switch on, subscription loaded and Pro. Unloaded counts as not allowed. */
  private async stillAllowed(): Promise<boolean> {
    return (await this.getEnabled()) && proState() === 'pro';
  }

  /**
   * Never throws. Each step is independent so one failure never leaves the
   * shared storage behind. Must only be called from inside the queue.
   */
  private async teardown(): Promise<void> {
    let registered = false;
    try {
      registered = (await AsyncStorage.getItem(LIVE_ACTIVITY_REGISTERED_KEY)) === 'true';
    } catch (error) {
      logServiceError(SERVICE, 'teardown.readRegistered', error as Error);
    }

    // Read the id first (and only if there is a registration to remove):
    // clearShared() deletes it, and getDeviceId() would mint one otherwise.
    let deviceId = '';
    if (registered) {
      try {
        deviceId = native.getDeviceId();
      } catch (error) {
        logServiceError(SERVICE, 'teardown.getDeviceId', error as Error);
      }
    }

    try {
      await AsyncStorage.removeItem(LIVE_ACTIVITY_MOOD_VERSE_KEY);
      await AsyncStorage.removeItem(LIVE_ACTIVITY_TIME_FORMAT_KEY);
    } catch (error) {
      logServiceError(SERVICE, 'teardown.clearKeys', error as Error);
    }

    try {
      await native.endAll();
    } catch (error) {
      logServiceError(SERVICE, 'teardown.endAll', error as Error);
    }

    if (deviceId) {
      try {
        const { error } = await supabase.functions.invoke(REGISTER_FUNCTION, {
          body: { action: 'unregister', deviceId },
        });
        if (error) logServiceError(SERVICE, 'teardown.unregister', error as Error);
      } catch (error) {
        logServiceError(SERVICE, 'teardown.unregister', error as Error);
      }
    }

    try {
      // Best effort even if unregister failed: the id is about to be deleted.
      await AsyncStorage.removeItem(LIVE_ACTIVITY_REGISTERED_KEY);
    } catch (error) {
      logServiceError(SERVICE, 'teardown.clearRegistered', error as Error);
    }

    try {
      native.clearShared();
    } catch (error) {
      logServiceError(SERVICE, 'teardown.clearShared', error as Error);
    }
  }

  private async readTimeFormat(): Promise<TimeFormat> {
    try {
      return (await AsyncStorage.getItem(LIVE_ACTIVITY_TIME_FORMAT_KEY)) === '12h' ? '12h' : '24h';
    } catch {
      return '24h';
    }
  }

  private async readMoodVerse(): Promise<CardVerse | null> {
    try {
      const raw = await AsyncStorage.getItem(LIVE_ACTIVITY_MOOD_VERSE_KEY);
      return raw ? (JSON.parse(raw) as CardVerse) : null;
    } catch {
      return null;
    }
  }

  private async writeSnapshot(timeFormat: TimeFormat): Promise<void> {
    const snapshot = buildVerseSnapshot({
      mood: await this.readMoodVerse(),
      today: await getDailyVerse(),
      timeFormat,
    });
    native.writeSnapshot(JSON.stringify(snapshot));
  }
}
