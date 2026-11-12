/**
 * The widget is only as current as the app's calls into WidgetService. Each
 * row below is a place that changes something the widget shows; the test
 * reads the source file and checks the call is there.
 *
 * What this does NOT catch: that the call is reached at run time, that it
 * passes the right arguments, or that it sits in the right branch. It only
 * stops a call site from being deleted or never added. The behaviour behind
 * each call is covered by widgetService.test.ts, and sign-out/deletion by
 * authService.liveActivity.test.ts.
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../../..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');

describe('the app keeps the widget current', () => {
  it.each([
    ['src/screens/GuidanceScreen.tsx', 'WidgetService.getInstance().onCheckIn('],
    ['src/screens/PathStepScreen.tsx', 'WidgetService.getInstance().onJourneyDayCompleted('],
    ['src/screens/PathDetailScreen.tsx', 'WidgetService.getInstance().refresh()'],
    ['src/screens/SettingsScreen.tsx', 'WidgetService.getInstance().refresh()'],
    ['src/services/liveActivity/liveActivitySwitch.ts', 'WidgetService.getInstance().refresh()'],
    ['src/hooks/useHomeData.ts', 'WidgetService.getInstance().setTimings('],
    ['src/hooks/useHomeData.ts', 'WidgetService.getInstance().refresh()'],
    ['src/services/notificationTopUpTask.ts', 'WidgetService.getInstance().setTimings('],
    ['src/services/authService.ts', 'WidgetService.getInstance().forget()'],
    ['src/services/widget/widgetService.ts', '.onPremiumChange('],
  ])('%s calls %s', (file, call) => {
    expect(read(file)).toContain(call);
  });

  it('the subscription service does not import the widget (no cycle)', () => {
    expect(read('src/services/subscriptionService.ts')).not.toMatch(/widget/i);
  });
});
