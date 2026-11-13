/**
 * The Live Activity switch flow shared by Settings and the Prayer Times
 * invitation, and the rule for when that invitation is shown.
 *
 * Neither function throws: a failure is logged and the caller carries on.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logServiceError } from '../errorLoggingService';
import { loadSchedulingTimings } from '../schedulingTimings';
import { SubscriptionService } from '../subscriptionService';
import { toWeeklyTimings } from '../../utils/weeklyTimings';
import { LIVE_ACTIVITY_INVITE_KEY, LiveActivityService } from './liveActivityService';
import { WidgetService } from '../widget/widgetService';

const SERVICE = 'liveActivitySwitch';

/**
 * Saves the switch, then syncs so the card appears now rather than at the next
 * Home open. `setEnabled` is awaited first: `sync` reads the saved switch, and
 * both run through the service's queue in call order.
 *
 * If the timings cannot be loaded (city path, offline, nothing cached) the
 * switch stays on and the next Home open syncs it — the user's choice is kept.
 */
export async function turnOnLiveActivity(timeFormat: '12h' | '24h'): Promise<void> {
  const service = LiveActivityService.getInstance();
  await service.setEnabled(true);
  try {
    const weekly = toWeeklyTimings(await loadSchedulingTimings());
    await service.sync(weekly, timeFormat);
  } catch (error) {
    logServiceError(SERVICE, 'turnOn', error instanceof Error ? error : new Error(String(error)));
  }
  // With the card on, the verse moves from the widget to the island.
  await WidgetService.getInstance().refresh();
}

/** Pro, supported device, switch off, and the user has not answered before. */
export async function shouldShowLiveActivityInvite(): Promise<boolean> {
  try {
    const service = LiveActivityService.getInstance();
    if (!SubscriptionService.getInstance().isPremium()) return false;
    if (!service.isAvailable()) return false;
    if (await service.getEnabled()) return false;
    return (await AsyncStorage.getItem(LIVE_ACTIVITY_INVITE_KEY)) === null;
  } catch {
    return false;
  }
}

/** Either answer ("Turn on" or "Not now") retires the invitation for good. */
export async function markLiveActivityInviteSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(LIVE_ACTIVITY_INVITE_KEY, 'true');
  } catch (error) {
    logServiceError(SERVICE, 'markInviteSeen', error instanceof Error ? error : new Error(String(error)));
  }
}
