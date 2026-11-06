// Reads the verse snapshot the app writes into the App Group and picks the
// verse for a given day. Mirrors src/services/liveActivity/verseSnapshot.ts:
//
//   VerseSnapshot = { version: 1, mood: CardVerse | null, daily: CardVerse[],
//                     timeFormat: '12h' | '24h', prayers?: { name, at }[] }
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
  /// The schedule the server was sent: five salah a day, epoch seconds,
  /// increasing. Absent before the first sync (verseSnapshot.ts `prayers`).
  let prayers: [SnapshotPrayer]?
}

struct SnapshotPrayer: Codable, Hashable {
  let name: String
  let at: Double
}

/// One column of the card's prayer board.
struct BoardColumn: Hashable {
  enum Role { case past, next, future }
  let name: String
  /// nil when the app has not shared this day's times; the column then shows
  /// the name and a dash, never a guessed time.
  let date: Date?
  let role: Role
}

enum PrayerBoard {
  static let names = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]

  /// The five columns for the day the next prayer belongs to: the five
  /// consecutive entries of the shared schedule, in salah order, that contain
  /// the next prayer. If the schedule is missing or does not line up (a time
  /// the app could not parse is skipped there), every column but the next shows
  /// a dash; the next prayer's own time always comes from the card's state.
  static func columns(next state: SakinaPrayerAttributes.ContentState,
                      prayers: [SnapshotPrayer]?) -> [BoardColumn] {
    let nextIndex = names.firstIndex(of: state.prayerName) ?? -1
    var dates: [Date?] = Array(repeating: nil, count: names.count)
    if nextIndex >= 0, let prayers = prayers,
       let j = prayers.firstIndex(where: { abs($0.at - state.prayerEpoch) < 60 && $0.name == state.prayerName }) {
      let first = j - nextIndex
      if first >= 0, first + names.count <= prayers.count {
        let day = Array(prayers[first..<(first + names.count)])
        if day.map({ $0.name }) == names {
          dates = day.map { Date(timeIntervalSince1970: $0.at) }
        }
      }
    }
    if nextIndex >= 0 {
      dates[nextIndex] = Date(timeIntervalSince1970: state.prayerEpoch)
    }
    return names.enumerated().map { index, name in
      let role: BoardColumn.Role = index == nextIndex ? .next : (nextIndex >= 0 && index < nextIndex ? .past : .future)
      return BoardColumn(name: name, date: dates[index], role: role)
    }
  }

  /// One short remembrance for each stretch before a prayer, by the next
  /// prayer's position. Shown as plain transliteration with no source line, in
  /// the spellings the app already uses most (SubhanAllah, Alhamdulillah,
  /// La ilaha illallah, Allahu Akbar, Astaghfirullah).
  static let phrases = ["SubhanAllah", "Alhamdulillah", "La ilaha illallah", "Allahu Akbar", "Astaghfirullah"]

  static func phrase(for state: SakinaPrayerAttributes.ContentState) -> String {
    let index = names.firstIndex(of: state.prayerName) ?? 0
    return phrases[index]
  }
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

  static func prayers() -> [SnapshotPrayer]? {
    return load()?.prayers
  }

  private static func pad(_ value: Int, _ width: Int) -> String {
    let digits = String(value)
    if digits.count >= width { return digits }
    return String(repeating: "0", count: width - digits.count) + digits
  }
}
