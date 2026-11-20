// LightLanternIntent — the one button on the prayer card: tap the lantern after
// saying the phrase beside it, and it lights. Tap again to undo.
//
// This file exists TWICE and the copies must stay byte-identical:
//   targets/live-activity/LightLanternIntent.swift          (widget extension)
//   modules/sakina-live-activity/app-target/LightLanternIntent.swift
//     (copied into the MAIN APP target by plugins/withLanternIntent.js)
// modules/sakina-live-activity/__tests__/attributesParity.test.ts enforces it.
//
// Why two copies: the widget's Button(intent:) needs the type to build the
// button, but a LiveActivityIntent's perform() runs in the app's process, so
// the app needs it too, and the system matches the two by type name. Apple
// asks for the intent in the app target itself; one compiled into a static
// library (our pod) is not found ("could not find intent"). The struct is
// public because one report says the intent was not found in release builds
// until it was.
//
// In the widget extension the pod is not importable, so perform() is empty
// there; it never runs there anyway.

import AppIntents
import Foundation
#if canImport(SakinaLiveActivityBridge)
import SakinaLiveActivityBridge
#endif

@available(iOS 17.2, *)
public struct LightLanternIntent: LiveActivityIntent {
  public static let title: LocalizedStringResource = "Light the lantern"
  /// Not offered in Shortcuts or Spotlight: it only makes sense on the card.
  public static let isDiscoverable: Bool = false

  @Parameter(title: "Card")
  public var activityId: String

  public init() {}

  public init(activityId: String) {
    self.activityId = activityId
  }

  public func perform() async throws -> some IntentResult {
    #if canImport(SakinaLiveActivityBridge)
    await SakinaLantern.toggle(activityId: activityId)
    #endif
    return .result()
  }
}
