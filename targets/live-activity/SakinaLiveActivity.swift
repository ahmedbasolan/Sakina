// The prayer Live Activity: Dynamic Island + lock screen / banner.
//
// Design "Light the lantern" (chosen by Ahmed 2026-11-06 from the previews in
// docs/superpowers/previews/live-activity, design I4 on G "Prayer board"):
//
//   Lock screen  the verse first, set like the app's Verse of the Day; under it
//                the prayer board — five columns, each prayer's name over its
//                time, passed ones dimmed, the next one gold with a thin line
//                under it that fills until the prayer — and, in the last cell,
//                the lantern beside one short remembrance. The fading gold line
//                on top and the home screen's mandala behind, still.
//   The tap      say the phrase, tap the lantern, and it lights (a second tap
//                undoes it). LightLanternIntent flips ContentState.lit; the
//                server's next push at the next prayer carries no `lit`, so the
//                lantern goes dark with the new phrase. Nothing is counted,
//                saved or sent.
//   Expanded     the lantern is the button (leading, mandala behind); name,
//                time and phrase beside the camera; the verse below.
//   Compact /    the lit lantern and the next prayer's time. Not interactive:
//   minimal      Apple allows buttons only on the lock screen and expanded.
//
// Calm by design: nothing ticks. The only moving thing is the line under the
// next prayer (ProgressView(timerInterval:)), which iOS advances itself with no
// pushes. The ticking countdown was dropped in the 2026-11-06 review: it did
// not fit beside the camera and the line already shows how near the prayer is.
// Tapping anywhere but the lantern opens Prayer Times.
//
// Height budgets: Apple caps the lock-screen presentation and the expanded
// island at 160 pt. The verse block gets a fixed share of that (CardLayout) and
// VerseView picks the richest tier that fits in it.

import ActivityKit
import AppIntents
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
  /// Lock screen: 160 total − 30 vertical padding (16 top for the gold line,
  /// 14 bottom) − 10 spacing − 40 board = 80, minus 2 for margin.
  static let lockScreenVerseHeight: CGFloat = 78
  /// The prayer board row.
  static let boardHeight: CGFloat = 40
  /// The lantern cell at the board's end. "La ilaha illallah" at 11 pt
  /// semibold is ~80 pt wide.
  static let lanternCellWidth: CGFloat = 86
  /// Expanded island: 160 − ~58 for the name / time / phrase block beside the
  /// camera (with the island's top margin) − ~12 bottom margin = ~90; 72 leaves
  /// margin, because overflow here would cut the end of an ayah.
  static let expandedVerseHeight: CGFloat = 72
}

struct SakinaPrayerLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: SakinaPrayerAttributes.self) { context in
      LockScreenCard(state: context.state, activityID: context.activityID)
        .activityBackgroundTint(Palette.night)
        .activitySystemActionForegroundColor(Palette.gold)
        .widgetURL(prayerTimesURL)
    } dynamicIsland: { context in
      makeDynamicIsland(state: context.state, activityID: context.activityID)
    }
  }
}

private func makeDynamicIsland(state: SakinaPrayerAttributes.ContentState, activityID: String) -> DynamicIsland {
  let prayerDate = PrayerClock.date(state)
  let twelveHour = VerseStore.uses12HourClock()
  let verse = VerseStore.pick(for: Date())
  let lit = state.lit ?? false
  let phrase = PrayerBoard.phrase(for: state)

  return DynamicIsland {
    DynamicIslandExpandedRegion(.leading) {
      LanternButton(activityID: activityID, phrase: phrase, lit: lit) {
        CardLantern(height: 26, lit: lit)
          .frame(width: 44, height: 44)
      }
      // The home screen's mandala around the lantern, like behind the greeting.
      // Thicker lines than on the lock screen: a hairline vanishes on black.
      .background(CardMandala(size: 130, lineWidth: 1.1))
    }
    DynamicIslandExpandedRegion(.trailing) {
      // Three short lines, nothing wider than ~100 pt: the trailing region
      // beside the camera is about that wide. "3:22 PM · 1:42:10" was ~97 pt,
      // and "La ilaha illallah · tap the lantern" ~170 pt, so neither is here.
      VStack(alignment: .trailing, spacing: 2) {
        Text(state.prayerName)
          .font(CardFont.title(16))
          .foregroundColor(Palette.cream)
        Text(PrayerClock.full(prayerDate, twelveHour: twelveHour))
          .font(.system(size: 13, weight: .semibold))
          .monospacedDigit()
          .foregroundColor(Palette.gold)
        Text(phrase)
          .font(.system(size: 12, weight: .medium))
          .foregroundColor(lit ? Palette.gold : Palette.creamSecondary)
          .lineLimit(1)
          .minimumScaleFactor(0.8)
      }
      .dynamicTypeSize(...DynamicTypeSize.large)
    }
    DynamicIslandExpandedRegion(.bottom) {
      VerseView(verse: verse, height: CardLayout.expandedVerseHeight)
        .dynamicTypeSize(...DynamicTypeSize.large)
    }
  } compactLeading: {
    CardLantern(height: 20)
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
    // Always lit in the island: a dim lantern there all day would read as
    // broken, and the island cannot take a tap anyway.
    CardLantern(height: 20)
  }
  .widgetURL(prayerTimesURL)
  .keylineTint(Palette.gold)
}

struct LockScreenCard: View {
  let state: SakinaPrayerAttributes.ContentState
  let activityID: String

  private var twelveHour: Bool { VerseStore.uses12HourClock() }
  private var verse: CardVerse? { VerseStore.pick(for: Date()) }

  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      VerseView(verse: verse, height: CardLayout.lockScreenVerseHeight)
      PrayerBoardRow(state: state, activityID: activityID, twelveHour: twelveHour)
    }
    // 14 pt sides: Apple's standard Lock Screen margin for Live Activities
    // (HIG), so the card lines up with notifications. 16 on top leaves the
    // gold line room.
    .padding(.horizontal, 14)
    .padding(.top, 16)
    .padding(.bottom, 14)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(
      GeometryReader { geo in
        ZStack {
          LinearGradient(colors: [Palette.night, Palette.dusk], startPoint: .top, endPoint: .bottom)
          // Half off the right edge, away from the start of the verse lines.
          CardMandala(size: 250)
            .position(x: geo.size.width - 55, y: geo.size.height / 2)
        }
        .clipped()
      }
    )
    .overlay(alignment: .top) {
      GoldHairline().padding(.horizontal, 28)
    }
    // See the CardLayout invariant: the whole lock-screen card is clamped.
    .dynamicTypeSize(...DynamicTypeSize.large)
  }
}

/// The masjid-style board: five columns, then the lantern cell.
struct PrayerBoardRow: View {
  let state: SakinaPrayerAttributes.ContentState
  let activityID: String
  let twelveHour: Bool

  var body: some View {
    let columns = PrayerBoard.columns(next: state, prayers: VerseStore.prayers())
    let lit = state.lit ?? false
    let phrase = PrayerBoard.phrase(for: state)

    HStack(spacing: 0) {
      ForEach(columns, id: \.name) { column in
        BoardColumnView(column: column, state: state, twelveHour: twelveHour)
          .frame(maxWidth: .infinity)
      }
      Rectangle()
        .fill(Palette.divider)
        .frame(width: 1, height: 32)
      LanternButton(activityID: activityID, phrase: phrase, lit: lit) {
        VStack(spacing: 3) {
          CardLantern(height: 18, lit: lit)
          Text(phrase)
            .font(.system(size: 11, weight: .semibold))
            .foregroundColor(lit ? Palette.gold : Palette.creamSecondary)
            .lineLimit(1)
            .minimumScaleFactor(0.8)
        }
        // 48 pt tall where the row is 40: Apple's minimum tap area is 44 pt,
        // so the button reaches into the card's bottom padding instead of
        // taking height from the verse.
        .frame(width: CardLayout.lanternCellWidth, height: 48)
      }
      .padding(.vertical, -4)
    }
    .frame(height: CardLayout.boardHeight)
  }
}

struct BoardColumnView: View {
  let column: BoardColumn
  let state: SakinaPrayerAttributes.ContentState
  let twelveHour: Bool

  private var color: Color {
    switch column.role {
    case .next: return Palette.gold
    case .past: return Palette.boardPast
    case .future: return Palette.boardFuture
    }
  }

  var body: some View {
    VStack(spacing: 1) {
      // Names and times only — never verse text — so a scale factor is safe:
      // on a 375-pt iPhone a column is ~48 pt and "Maghrib" ~43 pt.
      Text(column.name)
        .font(.system(size: 11, weight: .semibold))
        .lineLimit(1)
        .minimumScaleFactor(0.8)
      Text(column.date.map { PrayerClock.compact($0, twelveHour: twelveHour) } ?? "–")
        .font(.system(size: 13, weight: .semibold))
        .monospacedDigit()
        .lineLimit(1)
        .minimumScaleFactor(0.8)
      if column.role == .next {
        NextPrayerLine(state: state)
          .frame(width: 30, height: 3)
          .padding(.top, 2)
      }
    }
    .foregroundColor(color)
    .accessibilityElement(children: .combine)
  }
}

/// The thin line under the next prayer: fills from the previous prayer to this
/// one, advanced by iOS with no pushes. A plain track when the previous prayer
/// is unknown — a line starting at an arbitrary moment would claim a progress
/// it does not know.
struct NextPrayerLine: View {
  let state: SakinaPrayerAttributes.ContentState

  var body: some View {
    if let range = PrayerClock.progressRange(state) {
      ProgressView(timerInterval: range, countsDown: false) {
        EmptyView()
      } currentValueLabel: {
        EmptyView()
      }
      .progressViewStyle(.linear)
      .tint(Palette.gold)
    } else {
      Capsule().fill(Palette.track)
    }
  }
}

/// The one button on the card. Everything else opens Prayer Times.
struct LanternButton<Label: View>: View {
  let activityID: String
  let phrase: String
  let lit: Bool
  @ViewBuilder let label: () -> Label

  var body: some View {
    Button(intent: LightLanternIntent(activityId: activityID)) {
      label().contentShape(Rectangle())
    }
    .buttonStyle(.plain)
    .accessibilityLabel(Text(verbatim: lit ? "Lantern lit" : "Say \(phrase), then light the lantern"))
    .accessibilityHint(Text(verbatim: lit ? "Tap to undo" : ""))
  }
}
