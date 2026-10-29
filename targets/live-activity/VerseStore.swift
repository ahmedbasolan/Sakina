// Reads the verse snapshot the app writes into the App Group and picks the
// verse for a given day. Mirrors src/services/liveActivity/verseSnapshot.ts:
//
//   VerseSnapshot = { version: 1, mood: CardVerse | null, daily: CardVerse[],
//                     timeFormat: '12h' | '24h' }
//   CardVerse     = { arabic, english, ref, dateKey }   // dateKey "YYYY-MM-DD"
//
// and `pick` must behave exactly like `pickVerse`: the mood verse if it was
// chosen for this very day, else that day's daily verse, else nil (the card
// then shows no verse rather than a stale one). Verse text is used exactly as
// stored — never trimmed or sliced (CLAUDE.md, "Quoting Quran Text").

import Foundation

struct CardVerse: Codable, Hashable {
  let arabic: String
  let english: String
  let ref: String
  let dateKey: String
}

struct VerseSnapshot: Codable {
  let version: Int
  let mood: CardVerse?
  let daily: [CardVerse]
  /// "12h" or "24h"; absent or anything else reads as 24h.
  let timeFormat: String?
}

enum VerseStore {
  /// Must match app.json `ios.entitlements` and the module's SharedStore.
  static let appGroup = "group.com.lelahmed.sakina"
  /// The app writes the snapshot JSON as a String under this key.
  static let snapshotKey = "sakina.liveActivity.snapshot.v1"

  static func load() -> VerseSnapshot? {
    guard let defaults = UserDefaults(suiteName: appGroup),
          let json = defaults.string(forKey: snapshotKey),
          let data = json.data(using: .utf8)
    else { return nil }
    return try? JSONDecoder().decode(VerseSnapshot.self, from: data)
  }

  /// The LOCAL calendar date as "YYYY-MM-DD", like `formatDateKey` in
  /// dailyVerseService.ts (JS `getFullYear/getMonth/getDate`). That is always
  /// the Gregorian calendar in the device's time zone — NOT `Calendar.current`,
  /// which follows the user's chosen calendar (Hijri, Buddhist, …) and would
  /// produce keys like "1448-05-08" that never match.
  static func dateKey(for date: Date) -> String {
    var calendar = Calendar(identifier: .gregorian)
    calendar.timeZone = TimeZone.current
    let parts = calendar.dateComponents([.year, .month, .day], from: date)
    return pad(parts.year ?? 0, 4) + "-" + pad(parts.month ?? 0, 2) + "-" + pad(parts.day ?? 0, 2)
  }

  static func pick(_ snapshot: VerseSnapshot, dateKey: String) -> CardVerse? {
    if let mood = snapshot.mood, mood.dateKey == dateKey {
      return mood
    }
    return snapshot.daily.first(where: { $0.dateKey == dateKey })
  }

  static func pick(for date: Date) -> CardVerse? {
    guard let snapshot = load() else { return nil }
    return pick(snapshot, dateKey: dateKey(for: date))
  }

  static func uses12HourClock() -> Bool {
    return load()?.timeFormat == "12h"
  }

  private static func pad(_ value: Int, _ width: Int) -> String {
    let digits = String(value)
    if digits.count >= width { return digits }
    return String(repeating: "0", count: width - digits.count) + digits
  }
}
