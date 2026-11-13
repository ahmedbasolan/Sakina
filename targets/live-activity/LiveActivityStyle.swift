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
  /// The lit lantern's glow, rgba(255, 214, 120, 0.65).
  static let glow = Color(red: 1.0, green: 214.0 / 255.0, blue: 120.0 / 255.0, opacity: 0.65)
  /// Verse English, like VerseOfTheDay's `${Colors.text.primary}D9` (~85%).
  static let creamVerse = Color(red: 245.0 / 255.0, green: 237.0 / 255.0, blue: 227.0 / 255.0, opacity: 0.88)
  /// Board names and times for prayers still to come today.
  static let boardFuture = Color(red: 245.0 / 255.0, green: 237.0 / 255.0, blue: 227.0 / 255.0, opacity: 0.8)
  /// Board names and times for prayers already passed (≈4.5:1 on the card).
  static let boardPast = Color(red: 245.0 / 255.0, green: 237.0 / 255.0, blue: 227.0 / 255.0, opacity: 0.55)
  /// The track under the next prayer, before it fills.
  static let track = Color(red: 245.0 / 255.0, green: 237.0 / 255.0, blue: 227.0 / 255.0, opacity: 0.14)
  /// The hairline between the board and the lantern cell.
  static let divider = Color(red: 245.0 / 255.0, green: 237.0 / 255.0, blue: 227.0 / 255.0, opacity: 0.12)
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

  /// The verse reference, like VerseOfTheDay's serif italic.
  static func titleItalic(_ size: CGFloat) -> Font {
    return Font.custom("Georgia-Italic", fixedSize: size)
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

  /// Previous prayer ... next prayer, for the line under the next prayer on
  /// the board, or nil when the previous prayer is unknown or not before the
  /// next (a ClosedRange would trap).
  static func progressRange(_ state: SakinaPrayerAttributes.ContentState) -> ClosedRange<Date>? {
    guard let startEpoch = state.startEpoch else { return nil }
    let start = Date(timeIntervalSince1970: startEpoch)
    let end = date(state)
    guard start < end else { return nil }
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

/// The lantern, lit or waiting. Lit: the brand mark with a soft glow that
/// follows its own outline (a shadow, not a container — Apple's HIG asks for a
/// logo mark without one). Waiting: the same gold mark at 45%, no glow. Dim
/// gold, not grey: grey read as "switched off" in review.
struct CardLantern: View {
  let height: CGFloat
  var lit: Bool = true

  var body: some View {
    LanternMark(height: height)
      .opacity(lit ? 1 : 0.45)
      .shadow(color: lit ? Palette.glow : .clear, radius: 5)
  }
}

/// The home screen's mandala (src/components/AnimatedMandala.tsx, as
/// HeroHeader draws it with webLayers={2}): a 12-point star built from the
/// {12/3} and {12/4} star webs, an outer ring, a mid ring and a small core.
/// Drawn, not an image, so it stays sharp at any size and adds nothing to the
/// bundle. Still: a Live Activity cannot run its own animation, so unlike the
/// home screen it does not rotate.
struct MandalaShape: Shape {
  func path(in rect: CGRect) -> Path {
    var path = Path()
    let center = CGPoint(x: rect.midX, y: rect.midY)
    let radius = min(rect.width, rect.height) / 2 * 0.96
    // CGFloat throughout: with a Double angle, `radius * cos(a)` was ambiguous
    // between the Double and CGFloat overloads (build 12's only compile error).
    for step in [3, 4] {
      for i in 0..<12 {
        let a1: CGFloat = CGFloat(i) * .pi * 2 / 12 - .pi / 2
        let a2: CGFloat = CGFloat(i + step) * .pi * 2 / 12 - .pi / 2
        path.move(to: CGPoint(x: center.x + radius * cos(a1), y: center.y + radius * sin(a1)))
        path.addLine(to: CGPoint(x: center.x + radius * cos(a2), y: center.y + radius * sin(a2)))
      }
    }
    let ringScales: [CGFloat] = [1.0, 0.5, 0.18]
    for scale in ringScales {
      let r = radius * scale
      path.addEllipse(in: CGRect(x: center.x - r, y: center.y - r, width: r * 2, height: r * 2))
    }
    return path
  }
}

/// Outer + inner mandala like HeroHeader (inner 220/300 of the outer, turned
/// half a point so the two lattices interleave), faint gold hairlines. Purely
/// decorative: hidden from VoiceOver and never hit-tested.
struct CardMandala: View {
  let size: CGFloat
  /// Line width in points: hairline on the lock screen, thicker on the black
  /// island where a hairline vanishes (AnimatedMandala's strokeScale).
  var lineWidth: CGFloat = 0.5

  var body: some View {
    ZStack {
      MandalaShape()
        .stroke(Palette.gold.opacity(0.35 * 0.32), lineWidth: lineWidth)
        .frame(width: size, height: size)
      MandalaShape()
        .stroke(Palette.gold.opacity(0.25 * 0.32), lineWidth: lineWidth)
        .frame(width: size * 220 / 300, height: size * 220 / 300)
        .rotationEffect(.degrees(15))
    }
    .frame(width: size, height: size)
    .allowsHitTesting(false)
    .accessibilityHidden(true)
  }
}

/// The app's fading gold line (VerseOfTheDay's top border): transparent, gold,
/// transparent.
struct GoldHairline: View {
  var body: some View {
    LinearGradient(
      colors: [Palette.gold.opacity(0), Palette.gold, Palette.gold.opacity(0)],
      startPoint: .leading,
      endPoint: .trailing
    )
    .frame(height: 1)
    .accessibilityHidden(true)
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
