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
 * Switching off must reach the server, or the server keeps starting cards for
 * up to the 7 days the uploaded schedule covers. So the device id — the only
 * handle on the server row — is deleted only after a 2xx unregister. When the
 * unregister fails (offline, timeout, 5xx) the id is kept, the device is marked
 * switched off natively (no token posts, any arriving card is ended), a
 * pending-unregister marker is set, and the next `sync`, switch-off or account
 * wipe retries it before doing anything else. A re-enable never registers again
 * until the old registration is gone.
 *
 * Privacy: the register payload carries prayer INSTANTS (epoch seconds), the
 * IANA time zone and ids only — never coordinates, a city, the mood or any
 * verse text. Verse text lives in the on-device snapshot and nowhere else.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';
import * as native from '../../../modules/sakina-live-activity';
// Not '@env': react-native-dotenv does not inline it here under Jest's coverage
// instrumentation, which left a bare SUPABASE_URL reference and failed CI.
import { supabase, supabaseUrl, supabaseAnonKey } from '../../config/supabaseClient';
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
 * Set once a register may have reached the server (a 2xx, or a call that threw
 * after sending), cleared after a 2xx unregister. Teardown itself goes by the
 * native device id (`peekDeviceId`), not by this flag; the flag is what makes
 * `sync` tear down when Live Activities become unavailable (iOS setting off).
 */
export const LIVE_ACTIVITY_REGISTERED_KEY = '@live_activity_registered';
/**
 * Set when a switch-off could not unregister: the device id is kept for the
 * retry. Cleared only by a 2xx unregister (or when no id is left to remove).
 */
export const LIVE_ACTIVITY_PENDING_UNREGISTER_KEY = '@live_activity_pending_unregister';
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

async function readFlag(key: string, step: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(key)) === 'true';
  } catch (error) {
    logServiceError(SERVICE, step, error as Error);
    return false;
  }
}

/** The stored device id, `''` when there is none, `null` when it could not be read. */
function peekDeviceId(): string | null {
  try {
    return native.peekDeviceId();
  } catch (error) {
    logServiceError(SERVICE, 'peekDeviceId', error as Error);
    return null;
  }
}

export class LiveActivityService {
  private static instance: LiveActivityService | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  /** The newest args of a sync skipped because the subscription had not loaded. */
  private deferredSync: { weekly: PrayerTimings[]; timeFormat: TimeFormat } | null = null;
  private waitingForLoad = false;

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
   * First retries an unregister a switch-off left pending, whatever the switch
   * and subscription say, and stops there if it fails again. Only an explicit
   * switch-off, a LOADED non-Pro state, or Live Activities becoming unavailable
   * tears down; while the subscription state is still loading it does nothing,
   * and runs once more (with the newest args) as soon as it has loaded.
   */
  sync(weekly: PrayerTimings[], timeFormat: TimeFormat): Promise<void> {
    return this.enqueue(async () => {
      try {
        if (!(await this.clearPendingUnregister())) return;

        if (!this.isAvailable()) {
          // e.g. Live Activities switched off in iOS Settings after opting in:
          // the server must stop too. Nothing to do for a device that never
          // registered (no flag, no id).
          const registered = await readFlag(LIVE_ACTIVITY_REGISTERED_KEY, 'sync.readRegistered');
          if (registered || peekDeviceId() !== '') await this.teardown();
          return;
        }

        if (!(await this.getEnabled())) {
          await this.teardown();
          return;
        }
        const state = proState();
        if (state === 'unloaded') {
          this.deferUntilLoaded(weekly, timeFormat);
          return;
        }
        this.deferredSync = null; // this run supersedes a deferred one
        if (state === 'notPro') {
          await this.teardown();
          return;
        }

        const nativeConfig = {
          registerUrl: `${supabaseUrl}/functions/v1/${REGISTER_FUNCTION}`,
          anonKey: supabaseAnonKey,
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

        let registered = false;
        try {
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
            registered = true;
          }
        } catch (error) {
          // No answer, but the request may have reached the server: count the
          // device as registered so teardown removes it. Unregistering a device
          // the server never saw is harmless (it answers 200).
          logServiceError(SERVICE, 'sync.register', error as Error);
          await AsyncStorage.setItem(LIVE_ACTIVITY_REGISTERED_KEY, 'true');
        }

        if (registered) {
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

        // Only a device the server knows about gets a card: a local card
        // without a server row would never be updated or ended by the chain.
        if (!registered) return;

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

  /**
   * Remembers the newest skipped sync and re-runs it once the subscription has
   * loaded. Cold start: Home and AuthContext sync before RevenueCat answers, and
   * without this the first sync of a launch was simply lost.
   */
  private deferUntilLoaded(weekly: PrayerTimings[], timeFormat: TimeFormat): void {
    this.deferredSync = { weekly, timeFormat };
    if (this.waitingForLoad) return;
    this.waitingForLoad = true;
    SubscriptionService.getInstance().onLoaded(() => {
      this.waitingForLoad = false;
      const args = this.deferredSync;
      this.deferredSync = null;
      if (args) void this.sync(args.weekly, args.timeFormat);
    });
  }

  /**
   * Switch on, subscription loaded and Pro, and no switch-off still waiting
   * for the server. Unloaded counts as not allowed.
   */
  private async stillAllowed(): Promise<boolean> {
    if (await readFlag(LIVE_ACTIVITY_PENDING_UNREGISTER_KEY, 'stillAllowed.readPending')) return false;
    return (await this.getEnabled()) && proState() === 'pro';
  }

  /**
   * True when the server holds nothing this device left behind: no unregister
   * pending, or the pending one went through now. Must only be called from
   * inside the queue.
   */
  private async clearPendingUnregister(): Promise<boolean> {
    if (!(await readFlag(LIVE_ACTIVITY_PENDING_UNREGISTER_KEY, 'readPending'))) return true;

    const deviceId = peekDeviceId();
    if (deviceId === null) return false; // unreadable: keep waiting, never guess
    if (deviceId && !(await this.unregister(deviceId))) return false;
    await this.forgetRegistration();
    return true;
  }

  /** True only on a 2xx. Never throws. */
  private async unregister(deviceId: string): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke(REGISTER_FUNCTION, {
        body: { action: 'unregister', deviceId },
      });
      if (error) {
        logServiceError(SERVICE, 'unregister', error as Error);
        return false;
      }
      return true;
    } catch (error) {
      logServiceError(SERVICE, 'unregister', error as Error);
      return false;
    }
  }

  /** The server row is gone: drop the id, the snapshot and both markers. */
  private async forgetRegistration(): Promise<void> {
    try {
      await AsyncStorage.removeItem(LIVE_ACTIVITY_REGISTERED_KEY);
      await AsyncStorage.removeItem(LIVE_ACTIVITY_PENDING_UNREGISTER_KEY);
    } catch (error) {
      logServiceError(SERVICE, 'forgetRegistration.clearFlags', error as Error);
    }
    try {
      native.clearShared();
    } catch (error) {
      logServiceError(SERVICE, 'forgetRegistration.clearShared', error as Error);
    }
  }

  /**
   * Never throws. Each step is independent so one failure never leaves the
   * shared storage behind. Must only be called from inside the queue.
   *
   * Unregisters whenever a device id exists (read with `peekDeviceId`, which
   * never mints one — a user who never opted in still gets no id and no server
   * call). The id is deleted only after a 2xx; otherwise it is kept for the
   * retry and the unregister is marked pending.
   */
  private async teardown(): Promise<void> {
    const deviceId = peekDeviceId();

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

    // '' = no id, so nothing on the server to remove. null = the id could not
    // be read: it may exist, so it must not be deleted unseen.
    if (deviceId === '' || (deviceId !== null && (await this.unregister(deviceId)))) {
      await this.forgetRegistration();
      return;
    }

    // The server may still start cards for this id: keep it for the retry,
    // and make the native side refuse them meanwhile.
    try {
      await AsyncStorage.setItem(LIVE_ACTIVITY_PENDING_UNREGISTER_KEY, 'true');
    } catch (error) {
      logServiceError(SERVICE, 'teardown.markPending', error as Error);
    }
    try {
      native.markSwitchedOff();
    } catch (error) {
      logServiceError(SERVICE, 'teardown.markSwitchedOff', error as Error);
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
