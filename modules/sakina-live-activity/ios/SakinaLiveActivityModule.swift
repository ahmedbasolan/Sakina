// JS surface of the prayer Live Activity (see ../index.ts for the typed
// wrapper). Compiled into the main app, whose deployment target is iOS 15.1:
// every ActivityKit use is behind `#available(iOS 17.2, *)` (ruling R6) and
// below that each function answers false / does nothing.

import ActivityKit
import ExpoModulesCore
import UIKit
import WidgetKit

/// Must match `StaticConfiguration(kind:)` in targets/live-activity/SakinaPathWidget.swift.
private let pathWidgetKind = "SakinaPathWidget"

public class SakinaLiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SakinaLiveActivity")

    // iOS >= 17.2 (push-to-start), an iPhone, and Live Activities allowed.
    Function("isSupported") { () -> Bool in
      if #available(iOS 17.2, *) {
        if UIDevice.current.userInterfaceIdiom != .phone {
          return false
        }
        return ActivityAuthorizationInfo().areActivitiesEnabled
      }
      return false
    }

    Function("configure") { (registerUrl: String, anonKey: String) -> Void in
      SharedStore.setConfig(registerUrl: registerUrl, anonKey: anonKey)
      if #available(iOS 17.2, *) {
        Task { @MainActor in
          LiveActivityTokenForwarder.shared.startOrRepost()
        }
      }
    }

    Function("getDeviceId") { () -> String in
      let wasParticipating = SharedStore.isParticipating()
      let id = SharedStore.deviceId() // also lifts a switched-off mark
      if !wasParticipating && !id.isEmpty {
        // Token posts were skipped while there was no id (or the device was
        // marked switched off); send them now.
        if #available(iOS 17.2, *) {
          Task { @MainActor in
            LiveActivityTokenForwarder.shared.repostCurrentTokens()
          }
        }
      }
      return id
    }

    // Never creates an id: teardown must unregister an existing one but never
    // mint one for a user who never opted in.
    Function("peekDeviceId") { () -> String in
      return SharedStore.existingDeviceId() ?? ""
    }

    Function("writeSnapshot") { (json: String) -> Void in
      SharedStore.writeSnapshot(json)
      if #available(iOS 17.2, *) {
        Task { @MainActor in
          await LiveActivityTokenForwarder.shared.refreshRenderedContent()
        }
      }
    }

    // startEpoch: the previous prayer (epoch seconds), where the progress bar
    // starts; nil when unknown, and the card then shows no bar.
    AsyncFunction("startLocal") { (prayerName: String, prayerEpoch: Double, startEpoch: Double?) async -> Bool in
      if #available(iOS 17.2, *) {
        return await LiveActivityTokenForwarder.shared.startLocal(
          prayerName: prayerName,
          prayerEpoch: prayerEpoch,
          startEpoch: startEpoch
        )
      }
      return false
    }

    AsyncFunction("endAll") { () async -> Void in
      if #available(iOS 17.2, *) {
        await LiveActivityTokenForwarder.shared.endAll()
      }
    }

    // The unregister failed: keep the id for the retry, drop the rest, and
    // stop the forwarder from keeping or feeding a card meanwhile.
    Function("markSwitchedOff") {
      SharedStore.markSwitchedOff()
    }

    Function("clearShared") {
      SharedStore.clear()
    }

    // The Home Screen widget. WidgetKit ships in iOS 14, below the app's 15.1
    // floor, so no availability check is needed. Independent of the card:
    // these run whether or not a Live Activity exists.
    Function("writeWidgetSnapshot") { (json: String) -> Void in
      SharedStore.writeWidgetSnapshot(json)
      WidgetCenter.shared.reloadTimelines(ofKind: pathWidgetKind)
    }

    Function("clearWidgetSnapshot") {
      SharedStore.clearWidgetSnapshot()
      WidgetCenter.shared.reloadTimelines(ofKind: pathWidgetKind)
    }
  }
}
