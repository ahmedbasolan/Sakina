/**
 * App-side orchestrator for the Pro-only prayer Live Activity (iOS).
 *
 * Called fire-and-forget from hooks, so no public method ever throws: failures
 * are logged and swallowed. Everything is a no-op where the native module is
 * absent (Android, Jest, older iOS).
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
/** Last clock format `sync` saw, so `onVerseShown` can rewrite the snapshot. */
const LIVE_ACTIVITY_TIME_FORMAT_KEY = '@live_activity_time_format';

const REGISTER_FUNCTION = 'live-activity-register';
const SERVICE = 'LiveActivityService';

type TimeFormat = '12h' | '24h';

export class LiveActivityService {
  private static instance: LiveActivityService | null = null;

  static getInstance(): LiveActivityService {
    if (!LiveActivityService.instance) {
      LiveActivityService.instance = new LiveActivityService();
    }
    return LiveActivityService.instance;
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

  async setEnabled(value: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(LIVE_ACTIVITY_PREF_KEY, value ? 'true' : 'false');
      if (!value) await this.disableAndForget();
    } catch (error) {
      logServiceError(SERVICE, 'setEnabled', error as Error);
    }
  }

  /**
   * Brings the device and the server in line with the current switch + Pro
   * state. `weekly` is the app's local-time weekly timings, day 0 = today.
   */
  async sync(weekly: PrayerTimings[], timeFormat: TimeFormat): Promise<void> {
    try {
      if (!this.isAvailable()) return;

      const enabled = await this.getEnabled();
      if (!enabled || !SubscriptionService.getInstance().isPremium()) {
        await this.disableAndForget();
        return;
      }

      native.configure({
        registerUrl: `${SUPABASE_URL || ''}/functions/v1/${REGISTER_FUNCTION}`,
        anonKey: SUPABASE_ANON_KEY || '',
      });

      await AsyncStorage.setItem(LIVE_ACTIVITY_TIME_FORMAT_KEY, timeFormat);
      await this.writeSnapshot(timeFormat);

      const now = new Date();
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const schedule = buildSchedule(weekly, now, timeZone);

      const { error } = await supabase.functions.invoke(REGISTER_FUNCTION, {
        body: {
          action: 'register',
          deviceId: native.getDeviceId(),
          rcAppUserId: await Purchases.getAppUserID(),
          apnsEnv: __DEV__ ? 'sandbox' : 'production',
          timeZone,
          schedule,
        },
      });
      if (error) logServiceError(SERVICE, 'sync.register', error as Error);

      const nowS = now.getTime() / 1000;
      const next = schedule.find((p) => p.at > nowS);
      if (next) await native.startLocal(next.name, next.at);
    } catch (error) {
      logServiceError(SERVICE, 'sync', error as Error);
    }
  }

  /** A verse was shown for the user's mood: remember it for the card (Quran only). */
  async onVerseShown(content: Content): Promise<void> {
    try {
      if (!this.isAvailable()) return;
      if (!(await this.getEnabled()) || !SubscriptionService.getInstance().isPremium()) return;

      const verse = toCardVerse(content, formatDateKey(new Date()));
      if (!verse) return;

      await AsyncStorage.setItem(LIVE_ACTIVITY_MOOD_VERSE_KEY, JSON.stringify(verse));
      await this.writeSnapshot(await this.readTimeFormat());
    } catch (error) {
      logServiceError(SERVICE, 'onVerseShown', error as Error);
    }
  }

  /**
   * Switch off / lost Pro / account wipe: remove everything the feature put on
   * the device and tell the server to stop pushing. Each step is independent so
   * one failure never leaves the shared storage behind.
   */
  async disableAndForget(): Promise<void> {
    // Read the id first: clearShared() deletes it, and unregister needs it.
    let deviceId = '';
    try {
      deviceId = native.getDeviceId();
    } catch (error) {
      logServiceError(SERVICE, 'disableAndForget.getDeviceId', error as Error);
    }

    try {
      await AsyncStorage.removeItem(LIVE_ACTIVITY_MOOD_VERSE_KEY);
      await AsyncStorage.removeItem(LIVE_ACTIVITY_TIME_FORMAT_KEY);
    } catch (error) {
      logServiceError(SERVICE, 'disableAndForget.clearKeys', error as Error);
    }

    try {
      await native.endAll();
    } catch (error) {
      logServiceError(SERVICE, 'disableAndForget.endAll', error as Error);
    }

    if (deviceId) {
      try {
        const { error } = await supabase.functions.invoke(REGISTER_FUNCTION, {
          body: { action: 'unregister', deviceId },
        });
        if (error) logServiceError(SERVICE, 'disableAndForget.unregister', error as Error);
      } catch (error) {
        logServiceError(SERVICE, 'disableAndForget.unregister', error as Error);
      }
    }

    try {
      native.clearShared();
    } catch (error) {
      logServiceError(SERVICE, 'disableAndForget.clearShared', error as Error);
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
