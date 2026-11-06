// Design D's day path: the five prayers as dots evenly spaced on one line.
// Prayers already passed are lit dim gold, the next one is ringed in gold with a
// soft glow and named with its time; the stretch between the previous prayer and
// the next fills live.
//
// A Live Activity cannot run its own animation, so nothing here moves on its
// own except the live stretch: a ProgressView(timerInterval:) that iOS advances
// with no pushes. Everything else changes only when the card is updated at the
// next prayer. (The design preview's moving "now" glow is therefore drawn as
// this live fill instead.)
//
// Stops are evenly spaced, not placed by clock time: Maghrib and Isha are close
// together, and time-proportional spacing would run their labels into each
// other.

import SwiftUI

struct LanternPath: View {
  let state: SakinaPrayerAttributes.ContentState
  let twelveHour: Bool

  /// Fixed height of the path: track and dots (≈18 pt) plus the label row.
  static let height: CGFloat = 34

  private static let names = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]
  /// Where each prayer sits along the line, as a fraction of its width.
  private static let stops: [CGFloat] = [0.08, 0.29, 0.50, 0.71, 0.92]
  private static let lineY: CGFloat = 9.5
  private static let labelY: CGFloat = 27

  var body: some View {
    // -1 if the name is not one of the five (then no stop is marked "next").
    let next = Self.names.firstIndex(of: state.prayerName) ?? -1

    GeometryReader { geo in
      let width = geo.size.width

      ZStack(alignment: .topLeading) {
        // The whole line, dim.
        Capsule()
          .fill(Palette.trackDim)
          .frame(width: width, height: 3)
          .position(x: width / 2, y: Self.lineY)

        // Already passed: from the start up to the previous prayer's stop.
        if next > 0 {
          let doneWidth = width * Self.stops[next - 1]
          Capsule()
            .fill(Palette.gold.opacity(0.55))
            .frame(width: doneWidth, height: 3)
            .position(x: doneWidth / 2, y: Self.lineY)
        }

        // The live stretch: previous prayer -> next prayer, advanced by iOS.
        // Before Fajr it runs from the start of the line to Fajr's stop.
        if next >= 0, let range = PrayerClock.progressRange(state) {
          let from = next > 0 ? Self.stops[next - 1] : 0
          let segmentWidth = width * (Self.stops[next] - from)
          ProgressView(timerInterval: range, countsDown: false) {
            EmptyView()
          } currentValueLabel: {
            EmptyView()
          }
          .progressViewStyle(.linear)
          .tint(Palette.gold)
          .frame(width: segmentWidth)
          .position(x: width * from + segmentWidth / 2, y: Self.lineY)
        }

        // The five stops.
        ForEach(0..<5, id: \.self) { index in
          stop(index: index, next: next)
            .position(x: width * Self.stops[index], y: Self.lineY)
        }

        // Labels: every prayer's name, small; the next one in gold with its time.
        ForEach(0..<5, id: \.self) { index in
          label(index: index, next: next)
            .position(x: width * Self.stops[index], y: Self.labelY)
        }
      }
    }
    .frame(height: Self.height)
    .accessibilityElement(children: .ignore)
    .accessibilityLabel(Text("Next prayer \(state.prayerName)"))
  }

  @ViewBuilder
  private func stop(index: Int, next: Int) -> some View {
    if index == next {
      Circle()
        .fill(Color.black)
        .overlay(Circle().strokeBorder(Palette.gold, lineWidth: 2))
        .frame(width: 11, height: 11)
        .shadow(color: Palette.gold.opacity(0.85), radius: 4)
    } else if next >= 0 && index < next {
      Circle()
        .fill(Palette.gold.opacity(0.45))
        .frame(width: 9, height: 9)
    } else {
      Circle()
        .fill(Palette.stopFuture)
        .frame(width: 9, height: 9)
    }
  }

  @ViewBuilder
  private func label(index: Int, next: Int) -> some View {
    if index == next {
      Text(Self.names[index] + " " + PrayerClock.compact(PrayerClock.date(state), twelveHour: twelveHour))
        .font(.system(size: 10, weight: .semibold))
        .monospacedDigit()
        .foregroundColor(Palette.gold)
        .fixedSize()
    } else {
      Text(Self.names[index])
        .font(.system(size: 9, weight: .semibold))
        .foregroundColor(Palette.creamFaint)
        .fixedSize()
    }
  }
}
