// Draws one state of the square widget. It decides nothing: the kind, the
// words and the tap target all arrive in PathWidgetState.
//
// Never clipped, never shortened. Each layout is a ViewThatFits over complete
// versions of itself, in a frame of the widget's exact content height (a
// bounded proposal, as VerseView needs): the first version whose full height
// fits is drawn. The last version of a verse or a question is the app's
// `fallback` line, which always fits, so a long ayah or question is replaced
// by an invitation to open it, never cut. Every Text is
// `.fixedSize(horizontal: false, vertical: true)` so its measured height is
// the height of all its lines.
//
// Every font is fixed-size (CardFont, Font.system(size:)) and the root clamps
// Dynamic Type, as on the prayer card: a scaling font would grow past the
// square and WidgetKit would clip the bottom.
//
// Sizes follow the spec's "What each state looks like" and the mockup in
// docs/superpowers/previews/live-activity/together.html.

import SwiftUI
import WidgetKit

struct PathWidgetView: View {
  let state: PathWidgetState

  /// Content inset on every side, in points.
  private let inset: CGFloat = 14

  var body: some View {
    GeometryReader { geo in
      let height: CGFloat = max(0, geo.size.height - inset * 2)
      content
        .frame(width: max(0, geo.size.width - inset * 2), height: height, alignment: .topLeading)
        .padding(inset)
    }
    .dynamicTypeSize(...DynamicTypeSize.large)
    .widgetURL(state.url.flatMap { URL(string: $0) })
    .containerBackground(for: .widget) {
      PathWidgetBackground()
    }
  }

  @ViewBuilder
  private var content: some View {
    switch state.kind {
    case "locked":
      lockedLayout(kicker: state.kicker ?? WidgetSnapshotStore.locked.kicker ?? "",
                   text: state.text ?? WidgetSnapshotStore.locked.text ?? "")
    case "checkin":
      checkInLayout
    case "gentle":
      gentleLayout
    case "journey":
      journeyLayout
    case "verse":
      verseLayout
    case "reflection":
      reflectionLayout
    default:
      // A kind this build does not know (an older widget, a newer app).
      lockedLayout(kicker: WidgetSnapshotStore.locked.kicker ?? "", text: WidgetSnapshotStore.locked.text ?? "")
    }
  }

  // MARK: Layouts

  private func lockedLayout(kicker: String, text: String) -> some View {
    VStack(alignment: .leading, spacing: 0) {
      kickerText(kicker, gold: true)
      Spacer(minLength: 6)
      headline(text, size: 17)
      Spacer(minLength: 6)
    }
  }

  private var checkInLayout: some View {
    VStack(alignment: .leading, spacing: 0) {
      Spacer(minLength: 0)
      headline(state.text ?? "", size: 19)
      kickerText(state.sub ?? "")
        .padding(.top, 6)
    }
  }

  private var gentleLayout: some View {
    VStack(alignment: .leading, spacing: 0) {
      Spacer(minLength: 0)
      headline(state.text ?? "", size: 17)
    }
  }

  private var journeyLayout: some View {
    let day: Int = state.day ?? 0
    let total: Int = state.of ?? 0
    return ViewThatFits(in: .vertical) {
      journeyVersion(titleSize: 19, day: day, total: total)
      journeyVersion(titleSize: 17, day: day, total: total)
      journeyVersion(titleSize: 15, day: day, total: total)
    }
  }

  private func journeyVersion(titleSize: CGFloat, day: Int, total: Int) -> some View {
    VStack(alignment: .leading, spacing: 0) {
      kickerText(state.kicker ?? "")
        .privacySensitive()
      Spacer(minLength: 6)
      Text(verbatim: state.dayLabel ?? "")
        .font(Font.system(size: 12, weight: .semibold))
        .foregroundColor(Palette.gold)
        .widgetAccentable()
        .fixedSize(horizontal: false, vertical: true)
      headline(state.title ?? "", size: titleSize)
        .padding(.top, 3)
        .privacySensitive()
      if day >= 1 && total >= 1 && total <= 14 {
        marks(day: day, total: total)
          .padding(.top, 8)
      }
    }
  }

  private var verseLayout: some View {
    ViewThatFits(in: .vertical) {
      verseVersion {
        VStack(alignment: .leading, spacing: 4) {
          arabicText(state.arabic ?? "")
          bodyText(state.english ?? "", size: 12)
        }
      }
      verseVersion {
        bodyText(state.english ?? "", size: 13)
      }
      verseVersion {
        headline(state.fallback ?? "", size: 17)
      }
    }
  }

  private func verseVersion<Inner: View>(@ViewBuilder _ inner: () -> Inner) -> some View {
    VStack(alignment: .leading, spacing: 0) {
      kickerText(state.kicker ?? "")
      Spacer(minLength: 6)
      inner()
      refText(state.ref ?? "")
        .padding(.top, 5)
      Spacer(minLength: 0)
    }
  }

  private var reflectionLayout: some View {
    ViewThatFits(in: .vertical) {
      reflectionVersion { questionText(size: 14) }
      reflectionVersion { questionText(size: 13) }
      reflectionVersion { questionText(size: 12) }
      reflectionVersion { headline(state.fallback ?? "", size: 17) }
    }
  }

  private func reflectionVersion<Inner: View>(@ViewBuilder _ inner: () -> Inner) -> some View {
    VStack(alignment: .leading, spacing: 0) {
      kickerText(state.kicker ?? "")
      Spacer(minLength: 6)
      inner()
      Spacer(minLength: 6)
      refText(state.ref ?? "")
    }
  }

  // MARK: Pieces

  private func kickerText(_ text: String, gold: Bool = false) -> some View {
    Text(verbatim: text)
      .font(CardFont.titleItalic(11.5))
      .foregroundColor(gold ? Palette.gold : Palette.creamSecondary)
      .fixedSize(horizontal: false, vertical: true)
  }

  private func headline(_ text: String, size: CGFloat) -> some View {
    Text(verbatim: text)
      .font(CardFont.title(size))
      .foregroundColor(Palette.cream)
      .fixedSize(horizontal: false, vertical: true)
  }

  private func questionText(size: CGFloat) -> some View {
    Text(verbatim: state.question ?? "")
      .font(CardFont.title(size))
      .foregroundColor(Palette.cream)
      .fixedSize(horizontal: false, vertical: true)
      .privacySensitive()
  }

  private func arabicText(_ text: String) -> some View {
    Text(verbatim: text)
      .font(CardFont.arabic(15))
      .foregroundColor(Palette.cream)
      .multilineTextAlignment(.trailing)
      .fixedSize(horizontal: false, vertical: true)
      .frame(maxWidth: .infinity, alignment: .trailing)
  }

  private func bodyText(_ text: String, size: CGFloat) -> some View {
    Text(verbatim: text)
      .font(CardFont.title(size))
      .foregroundColor(Palette.creamVerse)
      .fixedSize(horizontal: false, vertical: true)
  }

  private func refText(_ text: String) -> some View {
    Text(verbatim: text)
      .font(CardFont.titleItalic(11))
      .foregroundColor(Palette.creamSecondary)
      .fixedSize(horizontal: false, vertical: true)
  }

  /// One thin mark per day: done days dim gold, today gold, the rest faint.
  private func marks(day: Int, total: Int) -> some View {
    HStack(spacing: 4) {
      ForEach(1...total, id: \.self) { index in
        Capsule()
          .fill(index < day ? Palette.gold.opacity(0.55) : (index == day ? Palette.gold : Palette.track))
          .frame(height: 3)
      }
    }
    .widgetAccentable()
    .accessibilityHidden(true)
  }
}

/// Night-to-dusk wash, the home screen's mandala past the top-right corner,
/// and the fading gold line along the top. iOS drops this whole layer in the
/// tinted and clear Home Screen styles.
struct PathWidgetBackground: View {
  var body: some View {
    ZStack(alignment: .top) {
      LinearGradient(colors: [Palette.night, Palette.dusk], startPoint: .top, endPoint: .bottom)
      CardMandala(size: 170)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
        .offset(x: 62, y: -62)
      GoldHairline()
        .padding(.horizontal, 26)
    }
  }
}
