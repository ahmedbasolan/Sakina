// Celestial Night tokens for the card, translated from src/theme/DesignSystem.ts,
// plus the prayer clock formatting shared by every presentation.

import SwiftUI

enum Palette {
  /// Colors.celestialWash top, #07111E.
  static let night = Color(red: 7.0 / 255.0, green: 17.0 / 255.0, blue: 30.0 / 255.0)
  /// Colors.celestialWash bottom, #0F1F30.
  static let dusk = Color(red: 15.0 / 255.0, green: 31.0 / 255.0, blue: 48.0 / 255.0)
  /// Colors.text.primary, #F5EDE3.
  static let cream = Color(red: 245.0 / 255.0, green: 237.0 / 255.0, blue: 227.0 / 255.0)
  /// Colors.text.secondary, rgba(245, 237, 227, 0.7).
  static let creamSecondary = Color(red: 245.0 / 255.0, green: 237.0 / 255.0, blue: 227.0 / 255.0, opacity: 0.7)
  /// Colors.accent.primary, #D4AF37.
  static let gold = Color(red: 212.0 / 255.0, green: 175.0 / 255.0, blue: 55.0 / 255.0)
}

/// Every font on the card is FIXED-SIZE: `Font.custom(_:fixedSize:)` here and
/// `Font.system(size:)` at the call sites. The card's height budget (160 pt,
/// see CardLayout in SakinaLiveActivity.swift) is a sum of these sizes; the
/// scaling `size:` overload of Font.custom, or a text style, would grow
/// with Dynamic Type and the system would cut the bottom of the card — the end
/// of the verse. The parity test rejects both forms in this target.
enum CardFont {
  /// Display / titles (Typography.fonts.serif). Georgia ships with iOS.
  static func title(_ size: CGFloat) -> Font {
    return Font.custom("Georgia", fixedSize: size)
  }

  /// Quran text. PostScript name of the bundled AmiriQuran-Regular.ttf
  /// (registered in this target's Info.plist UIAppFonts; the parity test
  /// reads the name out of the TTF and checks it matches this literal).
  static func arabic(_ size: CGFloat) -> Font {
    return Font.custom("AmiriQuran-Regular", fixedSize: size)
  }
}

enum PrayerClock {
  static func date(_ state: SakinaPrayerAttributes.ContentState) -> Date {
    return Date(timeIntervalSince1970: state.prayerEpoch)
  }

  /// Compact island: "3:42" in 12h (no AM/PM — the compact slot is narrow), "15:42" in 24h.
  static func compact(_ date: Date, twelveHour: Bool) -> String {
    return format(date, pattern: twelveHour ? "h:mm" : "HH:mm")
  }

  /// Expanded island and lock screen: "3:42 PM" in 12h, "15:42" in 24h.
  static func full(_ date: Date, twelveHour: Bool) -> String {
    return format(date, pattern: twelveHour ? "h:mm a" : "HH:mm")
  }

  /// The range for `Text(timerInterval:countsDown:)`. A ClosedRange traps when
  /// its lower bound passes its upper bound, which is exactly what happens if
  /// the card renders after the prayer time and before the next push lands.
  static func countdownRange(to end: Date) -> ClosedRange<Date> {
    let now = Date()
    let start = now < end ? now : end
    return start...end
  }

  private static func format(_ date: Date, pattern: String) -> String {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone.current
    formatter.dateFormat = pattern
    return formatter.string(from: date)
  }
}

struct LanternMark: View {
  let height: CGFloat

  var body: some View {
    Image("lantern")
      .renderingMode(.original)
      .resizable()
      .scaledToFit()
      .frame(height: height)
      .accessibilityHidden(true)
  }
}
