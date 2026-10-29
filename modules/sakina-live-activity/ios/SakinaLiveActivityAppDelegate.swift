// Starts the native token forwarder on every launch — including the
// background launch iOS performs to hand over a push-started activity's push
// token — so tokens reach the server without any JS running.
// Registered in ../expo-module.config.json `apple.appDelegateSubscribers`.

import ExpoModulesCore
import UIKit

public class SakinaLiveActivityAppDelegate: ExpoAppDelegateSubscriber {
  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    if #available(iOS 17.2, *) {
      Task { @MainActor in
        LiveActivityTokenForwarder.shared.start()
      }
    }
    return true
  }
}
