// SakinaPrayerAttributes — the Live Activity's data model.
//
// This file exists TWICE and the copies must stay byte-identical:
//   targets/live-activity/SakinaPrayerAttributes.swift        (widget extension)
//   modules/sakina-live-activity/ios/SakinaPrayerAttributes.swift (main app)
// modules/sakina-live-activity/__tests__/attributesParity.test.ts enforces it.
//
// APNs push-to-start names this type in `attributes-type`, so never rename it.
// The server pushes `content-state` as { "prayerName": String, "prayerEpoch":
// Double } (epoch seconds) and `attributes` as { "version": Int }.
//
// The main app deploys to iOS 15.1, hence the availability gate; the
// extension deploys to 17.2, where it is a no-op.

import ActivityKit
import Foundation

@available(iOS 17.2, *)
struct SakinaPrayerAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    var prayerName: String
    var prayerEpoch: Double
  }

  var version: Int
}
