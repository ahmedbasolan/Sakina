// JS surface of the prayer Live Activity (see ../index.ts for the typed
// wrapper). Compiled into the main app, whose deployment target is iOS 15.1:
// every ActivityKit use is behind `#available(iOS 17.2, *)` (ruling R6) and
// below that each function answers false / does nothing.

import ActivityKit
import ExpoModulesCore
import UIKit

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
      let hadId = SharedStore.existingDeviceId() != nil
      let id = SharedStore.deviceId()
      if !hadId && !id.isEmpty {
        // Token posts were skipped while there was no id; send them now.
        if #available(iOS 17.2, *) {
          Task { @MainActor in
            LiveActivityTokenForwarder.shared.repostCurrentTokens()
          }
        }
      }
      return id
    }

    Function("writeSnapshot") { (json: String) -> Void in
      SharedStore.writeSnapshot(json)
      if #available(iOS 17.2, *) {
        Task { @MainActor in
          await LiveActivityTokenForwarder.shared.refreshRenderedContent()
        }
      }
    }

    AsyncFunction("startLocal") { (prayerName: String, prayerEpoch: Double) async -> Bool in
      if #available(iOS 17.2, *) {
        return await LiveActivityTokenForwarder.shared.startLocal(
          prayerName: prayerName,
          prayerEpoch: prayerEpoch
        )
      }
      return false
    }

    AsyncFunction("endAll") { () async -> Void in
      if #available(iOS 17.2, *) {
        await LiveActivityTokenForwarder.shared.endAll()
      }
    }

    Function("clearShared") {
      SharedStore.clear()
    }
  }
}
