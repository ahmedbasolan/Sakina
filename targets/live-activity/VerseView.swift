// The verse on the card. The complete ayah or no ayah text at all
// (CLAUDE.md "Quoting Quran Text", spec "Verse rendering rule"):
//
//   1. Arabic + English + reference
//   2. English + reference
//   3. Reference only, as a pointer — no quotation, so no fragment. It
//      promises no action: the card's only tap target opens Prayer Times
//      (ruling R9), so the pointer offers no way to read the verse.
//
// `ViewThatFits` takes the first tier whose full height fits `height`. Every
// Text is `.fixedSize(horizontal: false, vertical: true)` so its measured
// height is the height of ALL its lines, and there is no `lineLimit` anywhere:
// a tier that does not fit is skipped, never clipped. The container is a
// fixed height because `ViewThatFits` only chooses against a bounded proposal.

import SwiftUI

struct VerseView: View {
  let verse: CardVerse?
  /// Vertical budget for the verse block, in points.
  let height: CGFloat

  var body: some View {
    if let verse = verse {
      ViewThatFits(in: .vertical) {
        VStack(alignment: .leading, spacing: 4) {
          arabicText(verse.arabic)
          englishText(verse.english)
          refText(verse.ref)
        }
        VStack(alignment: .leading, spacing: 4) {
          englishText(verse.english)
          refText(verse.ref)
        }
        pointerText(verse.ref)
      }
      .frame(height: height, alignment: .topLeading)
      .frame(maxWidth: .infinity, alignment: .leading)
      // Every font below is fixed-size already; the clamp keeps the budget
      // provable if one is ever switched to a scaling style.
      .dynamicTypeSize(...DynamicTypeSize.large)
    }
  }

  private func arabicText(_ text: String) -> some View {
    Text(text)
      .font(CardFont.arabic(16))
      .foregroundColor(Palette.cream)
      .multilineTextAlignment(.trailing)
      .fixedSize(horizontal: false, vertical: true)
      .frame(maxWidth: .infinity, alignment: .trailing)
  }

  private func englishText(_ text: String) -> some View {
    Text(text)
      .font(.system(size: 13))
      .foregroundColor(Palette.cream)
      .multilineTextAlignment(.leading)
      .fixedSize(horizontal: false, vertical: true)
  }

  private func refText(_ ref: String) -> some View {
    Text(ref)
      .font(.system(size: 11, weight: .medium))
      .foregroundColor(Palette.gold)
      .fixedSize(horizontal: false, vertical: true)
  }

  private func pointerText(_ ref: String) -> some View {
    Text(verbatim: "Your verse · \(ref)")
      .font(.system(size: 12))
      .foregroundColor(Palette.creamSecondary)
      .fixedSize(horizontal: false, vertical: true)
  }
}
