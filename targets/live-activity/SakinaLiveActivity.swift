// The prayer Live Activity: Dynamic Island + lock screen / banner.
//
// Design D, "Lantern path" (chosen 2026-11-06; previewed with A–C in
// docs/superpowers/previews/live-activity): design C's glowing lantern and
// quiet countdown, with B's day path in place of the bar — the verse leads;
// underneath, the lantern, the five prayers as stops on one line (LanternPath)
// and the countdown.
//
// Calm by design: the compact island is static text (the prayer's time); the
// only moving things are system views — the countdown text and the path's live
// stretch (ProgressView(timerInterval:)) — which iOS advances itself, with no
// pushes and no other animation. The whole card opens Prayer Times.
//
// Height budgets: Apple caps the lock-screen presentation and the expanded
// island at 160 pt. The verse block gets a fixed share of that (see the
// constants below) and VerseView picks the richest tier that fits in it.

import ActivityKit
import SwiftUI
import WidgetKit

@main
struct SakinaLiveActivityBundle: WidgetBundle {
  var body: some Widget {
    SakinaPrayerLiveActivity()
  }
}

private let prayerTimesURL = URL(string: "sakina://prayer-times")

/// INVARIANT: these budgets are sums of fixed point sizes. They hold only
/// because every font on the card is fixed-size (CardFont uses
/// `Font.custom(_:fixedSize:)`, everything else `Font.system(size:)`) AND the
/// card roots clamp `.dynamicTypeSize(...DynamicTypeSize.large)`. At a larger
/// Dynamic Type size a scaling font would grow the card past the budget and iOS
/// would truncate its bottom, which ViewThatFits cannot see. Keep both, or
/// re-derive these numbers.
private enum CardLayout {
  /// Lock screen: 160 total − 28 vertical padding − 10 spacing − 34 path row
  /// (LanternPath.height; taller than the 30 pt lantern beside it) = 88, minus
  /// 4 for margin.
  static let lockScreenVerseHeight: CGFloat = 84
  /// Expanded island: 160 − ~52 for the leading/trailing row beside the camera
  /// (with the island's top margin) − 10 spacing − 34 path row − ~12 bottom
  /// margin = ~52; 48 leaves margin, because overflow here would cut the bottom
  /// of the card, i.e. the path or the end of an ayah. At 48 most verses show
  /// as the "Your verse · ref" pointer here; the lock screen carries the text.
  static let expandedVerseHeight: CGFloat = 48
  /// Fixed width for the quiet countdown so it cannot claim the bar's room.
  /// "1:42:10" at 13 pt semibold is ~52 pt.
  static let countdownWidth: CGFloat = 64
}

struct SakinaPrayerLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: SakinaPrayerAttributes.self) { context in
      LockScreenCard(state: context.state)
        .activityBackgroundTint(Palette.night)
        .activitySystemActionForegroundColor(Palette.gold)
        .widgetURL(prayerTimesURL)
    } dynamicIsland: { context in
      makeDynamicIsland(state: context.state)
    }
  }
}

private func makeDynamicIsland(state: SakinaPrayerAttributes.ContentState) -> DynamicIsland {
  let prayerDate = PrayerClock.date(state)
  let twelveHour = VerseStore.uses12HourClock()
  let verse = VerseStore.pick(for: Date())

  return DynamicIsland {
    DynamicIslandExpandedRegion(.leading) {
      GlowLantern(size: 36, lanternHeight: 20)
    }
    DynamicIslandExpandedRegion(.trailing) {
      // Name over time, not "Maghrib · 5:44 PM" on one line: the trailing
      // region beside the camera is ~100 pt wide.
      VStack(alignment: .trailing, spacing: 2) {
        Text(state.prayerName)
          .font(CardFont.title(16))
          .foregroundColor(Palette.cream)
        Text(PrayerClock.full(prayerDate, twelveHour: twelveHour))
          .font(.system(size: 13, weight: .semibold))
          .monospacedDigit()
          .foregroundColor(Palette.gold)
      }
      .dynamicTypeSize(...DynamicTypeSize.large)
    }
    DynamicIslandExpandedRegion(.bottom) {
      VStack(alignment: .leading, spacing: 10) {
        VerseView(verse: verse, height: CardLayout.expandedVerseHeight)
        HStack(spacing: 10) {
          LanternPath(state: state, twelveHour: twelveHour)
          QuietCountdown(to: prayerDate)
        }
      }
      .dynamicTypeSize(...DynamicTypeSize.large)
    }
  } compactLeading: {
    GlowLantern(size: 28, lanternHeight: 18)
  } compactTrailing: {
    // Static on purpose: the island is in view all day, a ticking counter
    // there fights the calm-motion rule.
    //
    // The clock time only, no prayer name. Apple's HIG (Live Activities,
    // read 2026-11-06) gives each compact element ~52 pt on a 393-pt iPhone and
    // asks for "shortened units" so leading and trailing stay balanced; it also
    // asks compact views to fit a 28 pt circle where the island is limited in
    // width (landscape). "Maghrib 18:20" would be cut to "Maghr…". "18:20" fits
    // both, with the scale factor below. The name is in the expanded and
    // lock-screen views. Gold, to read as one piece with the lantern.
    Text(PrayerClock.compact(prayerDate, twelveHour: twelveHour))
      .font(.system(size: 14, weight: .semibold))
      .monospacedDigit()
      .foregroundColor(Palette.gold)
      .lineLimit(1)
      .minimumScaleFactor(0.7)
      .dynamicTypeSize(...DynamicTypeSize.large)
  } minimal: {
    GlowLantern(size: 30, lanternHeight: 18)
  }
  .widgetURL(prayerTimesURL)
  .keylineTint(Palette.gold)
}

struct LockScreenCard: View {
  let state: SakinaPrayerAttributes.ContentState

  private var prayerDate: Date { PrayerClock.date(state) }
  private var twelveHour: Bool { VerseStore.uses12HourClock() }
  private var verse: CardVerse? { VerseStore.pick(for: Date()) }

  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      VerseView(verse: verse, height: CardLayout.lockScreenVerseHeight)
      HStack(spacing: 10) {
        GlowLantern(size: 30, lanternHeight: 18)
        // The next prayer's name and time are on the path, under its stop.
        LanternPath(state: state, twelveHour: twelveHour)
        QuietCountdown(to: prayerDate)
      }
    }
    // 14 pt: Apple's standard Lock Screen margin for Live Activities (HIG), so
    // the card lines up with notifications.
    .padding(.horizontal, 14)
    .padding(.vertical, 14)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(
      LinearGradient(
        colors: [Palette.night, Palette.dusk],
        startPoint: .top,
        endPoint: .bottom
      )
    )
    // See the CardLayout invariant: the whole lock-screen card is clamped.
    .dynamicTypeSize(...DynamicTypeSize.large)
  }
}

/// The countdown is quiet (from design C): small, secondary cream, fixed width.
struct QuietCountdown: View {
  let to: Date

  var body: some View {
    Text(timerInterval: PrayerClock.countdownRange(to: to), countsDown: true)
      .font(.system(size: 13, weight: .semibold))
      .monospacedDigit()
      .foregroundColor(Palette.creamSecondary)
      .multilineTextAlignment(.trailing)
      .frame(width: CardLayout.countdownWidth, alignment: .trailing)
  }
}
