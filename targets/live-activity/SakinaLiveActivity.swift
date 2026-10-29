// The prayer Live Activity: Dynamic Island + lock screen / banner.
//
// Calm by design: the compact island is static text ("Asr 3:42"); the only
// moving thing anywhere is the system timer text in the expanded island and on
// the lock screen. No other animation. The whole card opens Prayer Times.
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
/// Dynamic Type size a scaling font would grow the prayer row past the budget
/// and iOS would truncate the bottom of the card — the end of the verse —
/// which ViewThatFits cannot see. Keep both, or re-derive these numbers.
private enum CardLayout {
  /// Lock screen: 160 total − 28 vertical padding − ~26 prayer row (Georgia
  /// 18 fixed / lantern 24) − 8 spacing, rounded down for margin.
  static let lockScreenVerseHeight: CGFloat = 92
  /// Expanded island: what is left under the leading/trailing regions.
  static let expandedVerseHeight: CGFloat = 72
  /// Fixed width for the countdown so the timer text cannot claim the row.
  static let countdownWidth: CGFloat = 84
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
      HStack(alignment: .center, spacing: 8) {
        LanternMark(height: 28)
        VStack(alignment: .leading, spacing: 2) {
          Text(state.prayerName)
            .font(CardFont.title(18))
            .foregroundColor(Palette.cream)
          Text(PrayerClock.full(prayerDate, twelveHour: twelveHour))
            .font(.system(size: 13, weight: .medium))
            .monospacedDigit()
            .foregroundColor(Palette.creamSecondary)
        }
      }
      .dynamicTypeSize(...DynamicTypeSize.large)
    }
    DynamicIslandExpandedRegion(.trailing) {
      Text(timerInterval: PrayerClock.countdownRange(to: prayerDate), countsDown: true)
        .font(.system(size: 20, weight: .semibold))
        .monospacedDigit()
        .foregroundColor(Palette.gold)
        .multilineTextAlignment(.trailing)
        .frame(width: CardLayout.countdownWidth, alignment: .trailing)
        .dynamicTypeSize(...DynamicTypeSize.large)
    }
    DynamicIslandExpandedRegion(.bottom) {
      VerseView(verse: verse, height: CardLayout.expandedVerseHeight)
    }
  } compactLeading: {
    LanternMark(height: 20)
  } compactTrailing: {
    // Static on purpose: the island is in view all day, a ticking counter
    // there fights the calm-motion rule. Prayer label, not verse text.
    Text(state.prayerName + " " + PrayerClock.compact(prayerDate, twelveHour: twelveHour))
      .font(.system(size: 13, weight: .semibold))
      .monospacedDigit()
      .foregroundColor(Palette.cream)
      .lineLimit(1)
      .minimumScaleFactor(0.7)
      .dynamicTypeSize(...DynamicTypeSize.large)
  } minimal: {
    LanternMark(height: 20)
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
    VStack(alignment: .leading, spacing: 8) {
      HStack(alignment: .center, spacing: 8) {
        LanternMark(height: 24)
        Text(state.prayerName)
          .font(CardFont.title(18))
          .foregroundColor(Palette.cream)
        Text(PrayerClock.full(prayerDate, twelveHour: twelveHour))
          .font(.system(size: 15, weight: .medium))
          .monospacedDigit()
          .foregroundColor(Palette.creamSecondary)
        Spacer(minLength: 8)
        Text(timerInterval: PrayerClock.countdownRange(to: prayerDate), countsDown: true)
          .font(.system(size: 17, weight: .semibold))
          .monospacedDigit()
          .foregroundColor(Palette.gold)
          .multilineTextAlignment(.trailing)
          .frame(width: CardLayout.countdownWidth, alignment: .trailing)
      }
      VerseView(verse: verse, height: CardLayout.lockScreenVerseHeight)
    }
    .padding(.horizontal, 16)
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
