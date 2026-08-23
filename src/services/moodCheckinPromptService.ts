import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrayerTimings } from './prayerTimesService';
import { formatDateYMD } from '../utils/date';
import { moodHistoryService } from './moodHistoryService';

export type CheckInWindow = 'morning' | 'night';

const PROMPT_ENABLED_KEY = '@notif_settings/mood_checkin';

/**
 * Parses time string (e.g. "05:15" or "05:15 (GST)") into minutes from midnight.
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(' ')[0].split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return -1;
  return hours * 60 + minutes;
}

/**
 * Evaluates the current check-in context based on prayer timings or local clock time.
 * - Day / Morning: From Fajr until Maghrib (or 04:30 to 18:30 fallback)
 * - Night: From Maghrib/Isha until next Fajr (or 18:30 to 04:30 fallback)
 */
export function getCurrentCheckInWindow(
  timings?: PrayerTimings | null,
  now: Date = new Date(),
): CheckInWindow {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (timings?.Fajr && timings?.Maghrib) {
    const fajrMins = timeToMinutes(timings.Fajr);
    const maghribMins = timeToMinutes(timings.Maghrib);

    if (fajrMins !== -1 && maghribMins !== -1) {
      // Day window: between Fajr and Maghrib
      if (currentMinutes >= fajrMins && currentMinutes < maghribMins) {
        return 'morning';
      }
      // Night window: from Maghrib onwards until next Fajr
      return 'night';
    }
  }

  // Clock-time fallback when prayer timings are unavailable
  if (currentMinutes >= 4 * 60 + 30 && currentMinutes < 18 * 60 + 30) {
    return 'morning';
  }
  return 'night';
}

export class MoodCheckinPromptService {
  private static instance: MoodCheckinPromptService;

  private constructor() {}

  public static getInstance(): MoodCheckinPromptService {
    if (!MoodCheckinPromptService.instance) {
      MoodCheckinPromptService.instance = new MoodCheckinPromptService();
    }
    return MoodCheckinPromptService.instance;
  }

  /**
   * Checks if the mood check-in prompt should be presented to the user.
   * If the user has not yet logged their heart/mood today, returns the
   * context window ('morning' | 'night') so the prompt appears and stays
   * active until the user logs their mood.
   */
  public async shouldShowPrompt(
    timings?: PrayerTimings | null,
    now: Date = new Date(),
  ): Promise<CheckInWindow | null> {
    const isPromptEnabled = await this.isEnabled();
    if (!isPromptEnabled) return null;

    const window = getCurrentCheckInWindow(timings, now);
    if (!window) return null;

    const todayStr = formatDateYMD(now);

    // Check if the user already logged a mood today
    try {
      const detail = await moodHistoryService.getDayDetail(todayStr);
      if (detail && detail.entries && detail.entries.length > 0) {
        // Already logged mood today -> no prompt needed
        return null;
      }
    } catch {
      // Non-fatal if detail check fails
    }

    // Has NOT logged today -> prompt and stay until logged
    return window;
  }

  /**
   * Get whether mood checkin prompts/notifications are enabled in settings.
   */
  public async isEnabled(): Promise<boolean> {
    try {
      const raw = await AsyncStorage.getItem(PROMPT_ENABLED_KEY);
      return raw === null ? true : JSON.parse(raw);
    } catch {
      return true;
    }
  }

  public async setEnabled(value: boolean): Promise<void> {
    await AsyncStorage.setItem(PROMPT_ENABLED_KEY, JSON.stringify(value));
  }
}

export default MoodCheckinPromptService;
