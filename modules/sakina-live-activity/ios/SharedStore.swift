// App Group storage shared between the app (this module) and the widget
// extension (targets/live-activity/VerseStore.swift reads the snapshot).
//
// Keys, all in UserDefaults(suiteName: "group.com.lelahmed.sakina"):
//   sakina.liveActivity.snapshot.v1      String  VerseSnapshot JSON written by JS
//   sakina.liveActivity.registerUrl.v1   String  register edge-function URL (configure)
//   sakina.liveActivity.anonKey.v1       String  Supabase anon key (configure)
//   sakina.liveActivity.deviceId.v1      String  lowercase UUID, created by getDeviceId
//   sakina.liveActivity.localStartId.v1  String  id of the activity the app started itself
//   sakina.liveActivity.localStartAt.v1  Double  its start, epoch seconds
//   sakina.liveActivity.switchedOff.v1   Bool    switched off, server not told yet
//   sakina.widget.snapshot.v1            String  Home Screen widget's WidgetSnapshot JSON
//                                                (src/services/widget/widgetTimeline.ts;
//                                                read by targets/live-activity/WidgetSnapshotStore.swift)
//
// The widget key is NOT touched by `clear()` or `markSwitchedOff()`: those run
// when the prayer card is switched off, and the widget outlives the card.
//
// No ActivityKit in this file: it compiles for the app's iOS 15.1 floor.

import Foundation

enum SharedStore {
  static let appGroup = "group.com.lelahmed.sakina"

  static let snapshotKey = "sakina.liveActivity.snapshot.v1"
  static let registerUrlKey = "sakina.liveActivity.registerUrl.v1"
  static let anonKeyKey = "sakina.liveActivity.anonKey.v1"
  static let deviceIdKey = "sakina.liveActivity.deviceId.v1"
  static let localStartIdKey = "sakina.liveActivity.localStartId.v1"
  static let localStartAtKey = "sakina.liveActivity.localStartAt.v1"
  static let switchedOffKey = "sakina.liveActivity.switchedOff.v1"
  static let widgetSnapshotKey = "sakina.widget.snapshot.v1"

  static var defaults: UserDefaults? {
    return UserDefaults(suiteName: appGroup)
  }

  static func setConfig(registerUrl: String, anonKey: String) {
    guard let defaults = defaults else { return }
    defaults.set(registerUrl, forKey: registerUrlKey)
    defaults.set(anonKey, forKey: anonKeyKey)
  }

  static func registerUrl() -> URL? {
    guard let value = defaults?.string(forKey: registerUrlKey), !value.isEmpty else { return nil }
    return URL(string: value)
  }

  static func anonKey() -> String? {
    guard let value = defaults?.string(forKey: anonKeyKey), !value.isEmpty else { return nil }
    return value
  }

  /// The stored device id, or nil. Never creates one: the token forwarder
  /// must stay silent for a device that has not (or no longer) opted in.
  static func existingDeviceId() -> String? {
    guard let value = defaults?.string(forKey: deviceIdKey), !value.isEmpty else { return nil }
    return value
  }

  /// The stored device id, created and persisted on first use. `""` only if
  /// the App Group itself is unavailable (missing entitlement). Called only
  /// when JS registers, i.e. the user is opting in, so it also lifts the
  /// switched-off mark.
  static func deviceId() -> String {
    defaults?.removeObject(forKey: switchedOffKey)
    if let existing = existingDeviceId() { return existing }
    guard let defaults = defaults else { return "" }
    let created = UUID().uuidString.lowercased()
    defaults.set(created, forKey: deviceIdKey)
    return created
  }

  /// True only while the user is opted in: a device id exists and no
  /// switch-off is waiting for the server. The token forwarder posts nothing
  /// and keeps no card unless this holds.
  static func isParticipating() -> Bool {
    guard existingDeviceId() != nil else { return false }
    return defaults?.bool(forKey: switchedOffKey) != true
  }

  static func writeSnapshot(_ json: String) {
    defaults?.set(json, forKey: snapshotKey)
  }

  static func writeWidgetSnapshot(_ json: String) {
    defaults?.set(json, forKey: widgetSnapshotKey)
  }

  static func clearWidgetSnapshot() {
    defaults?.removeObject(forKey: widgetSnapshotKey)
  }

  static func recordLocalStart(activityId: String, at epoch: Double) {
    guard let defaults = defaults else { return }
    defaults.set(activityId, forKey: localStartIdKey)
    defaults.set(epoch, forKey: localStartAtKey)
  }

  /// Start time of `activityId` if the app started it itself; nil for a card
  /// the server started (the server already knows when it started those).
  static func localStart(of activityId: String) -> Double? {
    guard let defaults = defaults,
          defaults.string(forKey: localStartIdKey) == activityId,
          let epoch = defaults.object(forKey: localStartAtKey) as? Double
    else { return nil }
    return epoch
  }

  static func clearLocalStart() {
    defaults?.removeObject(forKey: localStartIdKey)
    defaults?.removeObject(forKey: localStartAtKey)
  }

  /// Switched off but the unregister did not reach the server: removes the
  /// verse snapshot and the local-start record, keeps the device id (JS still
  /// has to unregister it), and sets the switched-off mark.
  static func markSwitchedOff() {
    defaults?.removeObject(forKey: snapshotKey)
    clearLocalStart()
    defaults?.set(true, forKey: switchedOffKey)
  }

  /// Removes the verse snapshot, the device id, the switched-off mark and the
  /// local-start record. The register URL and anon key are not personal and stay.
  static func clear() {
    defaults?.removeObject(forKey: snapshotKey)
    defaults?.removeObject(forKey: deviceIdKey)
    defaults?.removeObject(forKey: switchedOffKey)
    clearLocalStart()
  }
}
