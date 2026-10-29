// Owns every ActivityKit interaction of the main app, and forwards push
// tokens to the register endpoint natively — no JS — so it also works when
// iOS launches the app in the background after a push-to-start.
//
// Started from SakinaLiveActivityAppDelegate on every launch, and again
// (idempotently) from `configure`. Observes:
//   - Activity.pushToStartTokenUpdates  -> { pushToStartToken }
//   - Activity.activityUpdates          -> each new activity: observe it, end older ones
//   - each activity's pushTokenUpdates  -> { activityToken, activityStartedAt? }
//
// POST body (ruling R3): { "action": "token", "deviceId": <uuid>,
//   "pushToStartToken"?: <hex>, "activityToken"?: <hex>,
//   "activityStartedAt"?: <epoch seconds> } with headers Content-Type,
//   apikey and Authorization: Bearer <anon key>. Fire-and-forget.
//
// Nothing is posted until a device id exists (JS creates it through
// getDeviceId when the user opts in; clearShared removes it), so a device that
// turned the feature off never re-registers itself.
//
// Main-actor isolated: ActivityKit calls are cheap and this keeps the
// bookkeeping (observed ids, last posted tokens) free of data races.

import ActivityKit
import Foundation

@available(iOS 17.2, *)
@MainActor
final class LiveActivityTokenForwarder {
  static let shared = LiveActivityTokenForwarder()

  private var started = false
  private var observedActivityIds = Set<String>()
  private var lastPushToStartToken: String?
  private var lastActivityTokens: [String: String] = [:]

  private init() {}

  func start() {
    if started { return }
    started = true

    Task {
      for await data in Activity<SakinaPrayerAttributes>.pushToStartTokenUpdates {
        self.postPushToStartToken(hex(data))
      }
    }

    Task {
      for await activity in Activity<SakinaPrayerAttributes>.activityUpdates {
        self.observe(activity)
        await self.endAll(except: activity.id)
      }
    }

    let existing = Activity<SakinaPrayerAttributes>.activities
    for activity in existing {
      observe(activity)
    }
    // More than one card should never be live. ActivityKit does not expose a
    // start date; `activities` is taken to be in creation order, so the last
    // one is kept.
    if existing.count > 1, let newest = existing.last {
      let keepId = newest.id
      Task {
        await self.endAll(except: keepId)
      }
    }

    repostCurrentTokens()
  }

  /// For `configure`: the endpoint may be new, so the current tokens go out
  /// again (start() already sends them on its first run).
  func startOrRepost() {
    if started {
      repostCurrentTokens()
    } else {
      start()
    }
  }

  /// Re-sends the tokens iOS already handed out — after `configure` or after
  /// a device id is first created, when earlier posts were skipped.
  func repostCurrentTokens() {
    lastPushToStartToken = nil
    lastActivityTokens = [:]
    if let data = Activity<SakinaPrayerAttributes>.pushToStartToken {
      postPushToStartToken(hex(data))
    }
    for activity in Activity<SakinaPrayerAttributes>.activities {
      if let data = activity.pushToken {
        postActivityToken(hex(data), activityId: activity.id)
      }
    }
  }

  /// Starts a card from the app. False when one is already live, Live
  /// Activities are turned off, or ActivityKit refuses.
  func startLocal(prayerName: String, prayerEpoch: Double) -> Bool {
    guard ActivityAuthorizationInfo().areActivitiesEnabled else { return false }
    let live = Activity<SakinaPrayerAttributes>.activities.contains { activity in
      activity.activityState == .active || activity.activityState == .stale
    }
    if live { return false }

    let attributes = SakinaPrayerAttributes(version: 1)
    let state = SakinaPrayerAttributes.ContentState(prayerName: prayerName, prayerEpoch: prayerEpoch)
    let content = ActivityContent(state: state, staleDate: nil)
    do {
      let activity = try Activity<SakinaPrayerAttributes>.request(
        attributes: attributes,
        content: content,
        pushType: .token
      )
      SharedStore.recordLocalStart(activityId: activity.id, at: Date().timeIntervalSince1970)
      observe(activity)
      return true
    } catch {
      return false
    }
  }

  func endAll() async {
    for activity in Activity<SakinaPrayerAttributes>.activities {
      await activity.end(nil, dismissalPolicy: .immediate)
    }
    SharedStore.clearLocalStart()
  }

  /// Re-renders live cards after the verse snapshot changes, by re-applying
  /// their current content (the extension reads the snapshot at render time).
  func refreshRenderedContent() async {
    for activity in Activity<SakinaPrayerAttributes>.activities where activity.activityState == .active {
      await activity.update(activity.content)
    }
  }

  private func endAll(except keepId: String) async {
    for activity in Activity<SakinaPrayerAttributes>.activities where activity.id != keepId {
      await activity.end(nil, dismissalPolicy: .immediate)
    }
  }

  private func observe(_ activity: Activity<SakinaPrayerAttributes>) {
    let activityId = activity.id
    if observedActivityIds.contains(activityId) { return }
    observedActivityIds.insert(activityId)

    if let data = activity.pushToken {
      postActivityToken(hex(data), activityId: activityId)
    }
    Task {
      for await data in activity.pushTokenUpdates {
        self.postActivityToken(hex(data), activityId: activityId)
      }
      // The sequence finishes when the activity ends.
      self.observedActivityIds.remove(activityId)
      self.lastActivityTokens[activityId] = nil
    }
  }

  private func postPushToStartToken(_ token: String) {
    if token == lastPushToStartToken { return }
    guard TokenPoster.post(["pushToStartToken": token]) else { return }
    lastPushToStartToken = token
  }

  private func postActivityToken(_ token: String, activityId: String) {
    if lastActivityTokens[activityId] == token { return }
    var fields: [String: Any] = ["activityToken": token]
    if let startedAt = SharedStore.localStart(of: activityId) {
      fields["activityStartedAt"] = startedAt
    }
    guard TokenPoster.post(fields) else { return }
    lastActivityTokens[activityId] = token
  }
}

/// Lowercase hex of an APNs token.
private func hex(_ data: Data) -> String {
  return data.map { String(format: "%02x", $0) }.joined()
}

enum TokenPoster {
  /// Sends one token POST. Returns false (and sends nothing) when the app has
  /// not been configured or has no device id yet. The request itself is
  /// fire-and-forget: its outcome is ignored and it can never crash the app.
  @discardableResult
  static func post(_ fields: [String: Any]) -> Bool {
    guard let url = SharedStore.registerUrl(),
          let anonKey = SharedStore.anonKey(),
          let deviceId = SharedStore.existingDeviceId()
    else { return false }

    var body: [String: Any] = ["action": "token", "deviceId": deviceId]
    for (key, value) in fields {
      body[key] = value
    }
    guard JSONSerialization.isValidJSONObject(body),
          let data = try? JSONSerialization.data(withJSONObject: body)
    else { return false }

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue(anonKey, forHTTPHeaderField: "apikey")
    request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
    request.httpBody = data
    URLSession.shared.dataTask(with: request) { _, _, _ in }.resume()
    return true
  }
}
