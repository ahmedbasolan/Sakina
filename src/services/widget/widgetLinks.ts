/**
 * Where a `sakina://widget/<target>` tap lands (spec: "Deep links").
 *
 * A URL cannot carry what these screens need: PathStep takes whole objects
 * and Guidance takes a mood and an experience. So the link opens
 * WidgetLinkScreen, which asks this resolver for the destination and replaces
 * itself with it. Anything that can no longer be honoured (a check-in from
 * another day, no Journey running, an unknown target, a failed lookup) lands
 * on Home, silently: a tap on a stale widget must never show an error.
 */
import { CommonActions, StackActions } from '@react-navigation/native';
import type { GuidanceExperience, Mood } from '../../types';
import { WidgetService } from './widgetService';

export type WidgetLinkDestination =
  | { name: 'PathDetail'; params: { pathId: string; openToday: true } }
  | { name: 'Guidance'; params: { experience: GuidanceExperience; mood: Mood; startLayer?: 'context' } }
  | { name: 'Main'; params?: { screen: 'Journeys' } };

const HOME: WidgetLinkDestination = { name: 'Main' };

/**
 * The navigation action that takes WidgetLinkScreen to `destination`, given
 * the names of the routes on the root stack right now.
 *
 * Home is never pushed again: a `replace('Main')` from [Main, WidgetLink]
 * would mount a second tab navigator (and a second Home with its own timers
 * and listeners) on top of the first. So Home pops back to the Main already
 * there, or, with none in the stack, becomes the only screen. A real
 * destination replaces the in-between screen, so Back skips it.
 */
export function widgetLinkAction(destination: WidgetLinkDestination, stackRouteNames: string[]) {
  if (destination.name === 'Main') {
    return stackRouteNames.includes('Main')
      ? StackActions.popTo('Main', destination.params)
      : CommonActions.reset({ index: 0, routes: [{ name: 'Main', params: destination.params }] });
  }
  return StackActions.replace(destination.name, destination.params);
}

export async function resolveWidgetLink(target: string): Promise<WidgetLinkDestination> {
  try {
    const widget = WidgetService.getInstance();
    if (target === 'journey') {
      const running = await widget.getRunningJourney();
      // PathDetail opens today's day itself, so the guidance loading, the
      // leader-choice sheet and the error alert stay in the one place that has them.
      return running
        ? { name: 'PathDetail', params: { pathId: running.pathId, openToday: true } }
        : { name: 'Main', params: { screen: 'Journeys' } };
    }
    if (target === 'reflect' || target === 'verse') {
      const checkIn = await widget.getTodaysCheckIn();
      if (!checkIn) return HOME;
      return {
        name: 'Guidance',
        params:
          target === 'reflect'
            ? { experience: checkIn.experience, mood: checkIn.mood, startLayer: 'context' }
            : { experience: checkIn.experience, mood: checkIn.mood },
      };
    }
    return HOME;
  } catch {
    return HOME;
  }
}
