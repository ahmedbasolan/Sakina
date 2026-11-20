// Lights or dims the lantern on the prayer card ("Light the lantern").
//
// Called by LightLanternIntent's perform(), which iOS runs in the APP's process
// when someone taps the lantern on the card (LiveActivityIntent). The intent
// itself has to live in the app target, not in this pod: App Intents metadata
// is only extracted for the app target, and an intent compiled into a static
// library is reported as "could not find intent" (see plugins/withLanternIntent.js).
// It reaches this pod through `import SakinaLiveActivityBridge`, which is why
// this type is public.
//
// The lit state lives only in the card's ContentState (`lit`). Nothing is
// stored, counted or sent anywhere. The server's next push at the next prayer
// carries no `lit`, so the lantern goes dark again with the new phrase.

import Foundation
#if canImport(ActivityKit)
import ActivityKit
#endif

public enum SakinaLantern {
  /// Flips `lit` on the card with this id. A card that has ended, or an id that
  /// matches nothing, is left alone.
  public static func toggle(activityId: String) async {
    #if canImport(ActivityKit)
    guard #available(iOS 17.2, *) else { return }
    for activity in Activity<SakinaPrayerAttributes>.activities where activity.id == activityId {
      guard activity.activityState == .active || activity.activityState == .stale else { continue }
      var state = activity.content.state
      state.lit = !(state.lit ?? false)
      // Keep the card's own stale date: tapping must not extend a card whose
      // chain of pushes has stopped.
      await activity.update(ActivityContent(state: state, staleDate: activity.content.staleDate))
    }
    #endif
  }
}
