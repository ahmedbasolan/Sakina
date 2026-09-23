import { ImageSourcePropType } from 'react-native';
import { BackgroundTheme } from '../types';
import { portraitSource } from './portraitSource';
import { Spacing } from '../theme/DesignSystem';

// A gradient card's target shape. Closer to an actual phone screenshot
// (~9:16-9:20) than a square-ish social post crop (4:5): the whole point is
// "looks like a screenshot of the verse screen", and the extra height also
// buys real room for text before tiering has to shrink it. A photo card uses
// its photo's own shape instead (see shareCardLayout).
export const CARD_ASPECT_RATIO = 0.62; // width / height, portrait
// Header ("Sakina app") + footer (surah name + ref) + inter-block gaps:
// short, roughly-constant-length strings that don't scale with the verse,
// budgeted once here rather than re-measured per render.
export const NON_SCALING_CONTENT_HEIGHT = 90;

/**
 * The share card's insets, defined once and used by both ShareSheet.tsx's
 * styles and shareCardLayout's text budget. They used to be written twice,
 * so changing a style silently desynced the budget and the tests still
 * passed, because they only checked the function's own numbers.
 */
export const SHARE_CARD_INSETS = {
  /** previewCard: the gradient card's padding. */
  cardPaddingH: Spacing.xl,
  cardPaddingV: Spacing.xxl,
  /** previewCardPhoto: the photo card's own padding, tighter because a
   *  landscape photo gives it far less height. */
  photoCardPadding: Spacing.lg,
  /** glassPanel: the text backing inside a photo card. */
  photoPanelPadding: Spacing.lg,
  /** previewQuote: the English translation's side margin. */
  quoteMarginH: Spacing.md,
} as const;

export interface ShareCardLayout {
  /** previewCard's `minHeight`: the size it renders at unless a verse too
   *  long for even the smallest tier makes it grow. */
  cardTargetHeight: number;
  /** Width and height the verse text must fit in, for pickShareCardTextTier. */
  textWidth: number;
  heightBudget: number;
}

/**
 * Sizes the share card. A photo card takes its photo's own shape, so the
 * photo fills it edge to edge with nothing cropped, and the text tier is then
 * picked to fit that height. A gradient card, or a photo whose size can't be
 * read (`photoAspect` null), uses CARD_ASPECT_RATIO.
 *
 * The insets come from SHARE_CARD_INSETS, the same values ShareSheet.tsx's
 * styles use. The gradient branch also subtracts a glassPanel-sized margin it
 * doesn't have (Spacing.lg * 2 across, Spacing.xl * 2 down): a deliberate
 * safety margin, so it can only pick an equal or smaller tier, never one that
 * overflows.
 */
export function shareCardLayout(
  cardWidth: number,
  isPhoto: boolean,
  photoAspect: number | null,
): ShareCardLayout {
  const cardTargetHeight = cardWidth / (photoAspect ?? CARD_ASPECT_RATIO);
  const i = SHARE_CARD_INSETS;
  const textWidth = isPhoto
    ? cardWidth - (i.photoCardPadding + i.photoPanelPadding + i.quoteMarginH) * 2
    : cardWidth - i.cardPaddingH * 2 - Spacing.lg * 2 - i.quoteMarginH;
  const heightBudget = isPhoto
    ? cardTargetHeight - (i.photoCardPadding + i.photoPanelPadding) * 2 - NON_SCALING_CONTENT_HEIGHT
    : cardTargetHeight - i.cardPaddingV * 2 - Spacing.xl * 2 - NON_SCALING_CONTENT_HEIGHT;
  return { cardTargetHeight, textWidth, heightBudget };
}

export interface CardTheme {
  id: string;
  colors: [string, string, ...string[]];
  label: string;
  textColor?: string;
}

export type CardBackground =
  | { kind: 'gradient'; colors: [string, string, ...string[]]; textColor: string; subTextColor: string }
  | { kind: 'photo'; imageSource: ImageSourcePropType; textColor: string; subTextColor: string };

/**
 * Resolves what the share-card preview should render as its background.
 * Premium nature-photo backgrounds only apply when `isPremium` is true — a
 * lapsed subscriber with a stale `selectedPhotoTheme` in state falls back to
 * the gradient instead of rendering a background they can no longer pick.
 */
export function resolveCardBackground(
  selectedTheme: CardTheme,
  selectedPhotoTheme: BackgroundTheme | null,
  isPremium: boolean,
): CardBackground {
  if (isPremium && selectedPhotoTheme) {
    return {
      kind: 'photo',
      // The portrait crop when there is one: the share card takes its
      // photo's shape, and a landscape photo makes a card too short for a
      // verse.
      imageSource: portraitSource(selectedPhotoTheme),
      textColor: '#FFFFFF',
      subTextColor: 'rgba(255, 255, 255, 0.8)',
    };
  }
  return {
    kind: 'gradient',
    colors: selectedTheme.colors,
    textColor: selectedTheme.textColor || '#FFFFFF',
    subTextColor: selectedTheme.textColor ? 'rgba(31, 41, 55, 0.7)' : 'rgba(255, 255, 255, 0.8)',
  };
}

export interface ShareTextContent {
  text: string;
  source: string;
  arabicText?: string;
  transliteration?: string;
}

export interface ShareTextToggles {
  showEnglish: boolean;
  showArabic: boolean;
  showTransliteration: boolean;
}

export interface ShareCardTextTier {
  arabicFontSize: number;
  arabicLineHeight: number;
  translitFontSize: number;
  translitLineHeight: number;
  quoteFontSize: number;
  quoteLineHeight: number;
}

export interface ShareCardVisibleText {
  arabicText?: string;
  transliteration?: string;
  englishText?: string;
}

// Largest to smallest. Only the verse-dependent blocks (Arabic,
// transliteration, English translation) scale — the header ("Sakina app")
// and footer (surah name + ref) are short, roughly constant-length strings
// that never need to shrink, so their sizes stay fixed in ShareSheet.tsx.
const TEXT_TIERS: ShareCardTextTier[] = [
  { arabicFontSize: 24, arabicLineHeight: 48, translitFontSize: 13, translitLineHeight: 20, quoteFontSize: 19, quoteLineHeight: 28 },
  { arabicFontSize: 22, arabicLineHeight: 44, translitFontSize: 12, translitLineHeight: 18, quoteFontSize: 17, quoteLineHeight: 25 },
  { arabicFontSize: 19, arabicLineHeight: 38, translitFontSize: 11, translitLineHeight: 16, quoteFontSize: 15, quoteLineHeight: 22 },
  { arabicFontSize: 16, arabicLineHeight: 32, translitFontSize: 10, translitLineHeight: 15, quoteFontSize: 13, quoteLineHeight: 19 },
  { arabicFontSize: 13, arabicLineHeight: 26, translitFontSize: 9, translitLineHeight: 13, quoteFontSize: 11, quoteLineHeight: 16 },
];

// Rough average glyph-advance width as a fraction of font size. These are
// estimates for TIER SELECTION only, not real layout: React Native does the
// actual wrapping once a tier is applied, so an imprecise ratio only risks
// picking one tier off, never a broken render. Calibrated against a real
// rendered reference (32:16's Arabic/English wrapping at known font sizes
// and column width), not guessed from font-family vibes — see
// shareCard.test.ts for the reference numbers this was checked against.
const LATIN_CHAR_WIDTH_RATIO = 0.55;
// Deliberately calibrated against DIACRITIC-STRIPPED length (see
// stripArabicDiacritics below), not raw .length. Quran Uthmani text carries
// a harakah (tashkeel mark) after nearly every letter — raw .length on
// 32:16's Arabic ran ~1.7x the stripped count (113 vs 65 for the same
// string) purely from combining marks that render above/below the base
// letter and add ~no horizontal width, so sizing off raw length nearly
// doubled the estimated wrapped height and collapsed every verse straight to
// the smallest tier regardless of actual length.
const ARABIC_CHAR_WIDTH_RATIO = 0.42;

// Arabic harakat/tanwin/sukun and Quranic small-sign marks (U+064B-U+065F,
// U+0670 superscript alef, U+06D6-U+06ED waqf/recitation signs). Width
// estimation only — never applied to text that's actually rendered or
// stored, so this doesn't touch the "don't normalise Arabic" rule in
// CLAUDE.md (that rule is about mutating the source text; this measures a
// throwaway copy for a font-size guess).
const ARABIC_DIACRITIC_PATTERN = /[ً-ٰٟۖ-ۭ]/g;

function estimateBlockHeight(
  text: string | undefined,
  fontSize: number,
  lineHeight: number,
  widthRatio: number,
  textWidth: number,
  stripArabicDiacritics: boolean,
): number {
  if (!text) return 0;
  const charCount = stripArabicDiacritics
    ? text.replace(ARABIC_DIACRITIC_PATTERN, '').length
    : text.length;
  if (charCount === 0) return 0;
  const charsPerLine = Math.max(1, Math.floor(textWidth / (fontSize * widthRatio)));
  const lines = Math.ceil(charCount / charsPerLine);
  return lines * lineHeight;
}

/**
 * Picks the largest text tier whose estimated wrapped height fits within
 * `heightBudget` at the given `textWidth`, so the share card's verse text
 * shrinks to fit a fixed-size card instead of the card growing to fit the
 * text (CLAUDE.md's "font-size scaling (fixed container, tiered size by
 * length)" — the sanctioned alternative to letting verse UI wrap freely).
 *
 * Falls back to the smallest tier if even that overflows the budget — for a
 * genuinely enormous ayah (e.g. 2:282, ~1300 characters of translation) no
 * legible fixed-size card fits it, and the caller's card is expected to grow
 * past its target height in that rare case rather than clip the text, which
 * is never acceptable regardless of length.
 */
export function pickShareCardTextTier(
  visible: ShareCardVisibleText,
  textWidth: number,
  heightBudget: number,
): ShareCardTextTier {
  for (const tier of TEXT_TIERS) {
    const arabicHeight = estimateBlockHeight(
      visible.arabicText,
      tier.arabicFontSize,
      tier.arabicLineHeight,
      ARABIC_CHAR_WIDTH_RATIO,
      textWidth,
      true,
    );
    const translitHeight = estimateBlockHeight(
      visible.transliteration,
      tier.translitFontSize,
      tier.translitLineHeight,
      LATIN_CHAR_WIDTH_RATIO,
      textWidth,
      false,
    );
    const quoteHeight = estimateBlockHeight(
      visible.englishText,
      tier.quoteFontSize,
      tier.quoteLineHeight,
      LATIN_CHAR_WIDTH_RATIO,
      textWidth,
      false,
    );
    if (arabicHeight + translitHeight + quoteHeight <= heightBudget) return tier;
  }
  return TEXT_TIERS[TEXT_TIERS.length - 1];
}

/** Builds the plain-text share payload from the toggled-on content sections. */
export function buildShareText(content: ShareTextContent, toggles: ShareTextToggles): string {
  let shareText = '';
  if (toggles.showEnglish) shareText += `"${content.text}"\n\n`;
  if (toggles.showArabic && content.arabicText) shareText += `${content.arabicText}\n`;
  if (toggles.showTransliteration && content.transliteration)
    shareText += `(${content.transliteration})\n`;
  shareText += `\n${content.source}\n\nShared via Sakina`;
  return shareText;
}
