// Reads the Home Screen widget's snapshot from the App Group. Mirrors
// src/services/widget/widgetTimeline.ts:
//
//   WidgetSnapshot = { version: 1, entries: { at: number, state: WidgetState }[] }
//
// `at` is epoch seconds; `state` is everything the widget draws, text
// included (src/services/widget/widgetState.ts). The app decides every rule;
// this file only decodes and picks the entry in force. Text is used exactly
// as stored, never trimmed or sliced (CLAUDE.md, "Quoting Quran Text").
//
// modules/sakina-live-activity/__tests__/widgetParity.test.ts pins the key,
// the field names and the locked strings to the TypeScript.

import Foundation

/// One state of the widget. Every field but `kind` is optional because each
/// kind carries only its own; a missing key decodes as nil.
struct PathWidgetState: Codable, Hashable {
  let kind: String
  let kicker: String?
  let text: String?
  let sub: String?
  let dayLabel: String?
  let title: String?
  let day: Int?
  let of: Int?
  let arabic: String?
  let english: String?
  let ref: String?
  let question: String?
  let fallback: String?
  let url: String?

  init(
    kind: String,
    kicker: String? = nil,
    text: String? = nil,
    sub: String? = nil,
    dayLabel: String? = nil,
    title: String? = nil,
    day: Int? = nil,
    of: Int? = nil,
    arabic: String? = nil,
    english: String? = nil,
    ref: String? = nil,
    question: String? = nil,
    fallback: String? = nil,
    url: String? = nil
  ) {
    self.kind = kind
    self.kicker = kicker
    self.text = text
    self.sub = sub
    self.dayLabel = dayLabel
    self.title = title
    self.day = day
    self.of = of
    self.arabic = arabic
    self.english = english
    self.ref = ref
    self.question = question
    self.fallback = fallback
    self.url = url
  }
}

struct PathWidgetEntryModel: Codable {
  let at: Double
  let state: PathWidgetState
}

struct PathWidgetSnapshot: Codable {
  let version: Int
  let entries: [PathWidgetEntryModel]
}

enum WidgetSnapshotStore {
  /// Must match WIDGET_SNAPSHOT_KEY (widgetTimeline.ts) and SharedStore.swift.
  static let snapshotKey = "sakina.widget.snapshot.v1"

  /// What the widget shows with no usable snapshot (never opened since the
  /// update, signed out, not Pro). Personal-data-free by construction.
  static let locked = PathWidgetState(
    kind: "locked",
    kicker: "Sakina Pro",
    text: "Your day with Sakina, on your Home Screen.",
    url: "sakina://pro"
  )

  /// The widget gallery's preview only. Never shown on a Home Screen.
  static let sample = PathWidgetState(
    kind: "checkin",
    text: "How is your heart today?",
    sub: "A verse for how you feel.",
    url: "sakina://check-in"
  )

  static func load() -> PathWidgetSnapshot? {
    guard let defaults = UserDefaults(suiteName: VerseStore.appGroup),
          let json = defaults.string(forKey: snapshotKey),
          let data = json.data(using: .utf8)
    else { return nil }
    return try? JSONDecoder().decode(PathWidgetSnapshot.self, from: data)
  }

  /// The entry in force at `now` (re-dated to `now`) followed by every later
  /// one. No snapshot, an unknown version, or no entry at or before `now`:
  /// the locked state alone.
  static func upcoming(from now: Date) -> [(date: Date, state: PathWidgetState)] {
    guard let snapshot = load(), snapshot.version == 1 else { return [(now, locked)] }
    let t = now.timeIntervalSince1970
    let sorted = snapshot.entries.sorted { $0.at < $1.at }
    guard let current = sorted.lastIndex(where: { $0.at <= t }) else { return [(now, locked)] }
    var out: [(date: Date, state: PathWidgetState)] = [(now, sorted[current].state)]
    for entry in sorted[(current + 1)...] {
      out.append((Date(timeIntervalSince1970: entry.at), entry.state))
    }
    return out
  }
}
