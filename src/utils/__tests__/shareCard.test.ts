import {
  resolveCardBackground,
  buildShareText,
  pickShareCardTextTier,
  shareCardLayout,
  quoteTranslation,
  photoLayerSize,
  previewScale,
  PREVIEW_MAX_HEIGHT_FRACTION,
  CARD_ASPECT_RATIO,
  CardTheme,
} from '../shareCard';
import fs from 'fs';
import path from 'path';
import { quranContent } from '../../data/quranData';
import { BackgroundTheme } from '../../types';

const purpleTheme: CardTheme = { id: 'purple', colors: ['#C4B5FD', '#8B5CF6'], label: 'Royal' };
const whiteTheme: CardTheme = {
  id: 'white',
  colors: ['#FFFFFF', '#F3F4F6'],
  label: 'Pearl',
  textColor: '#1F2937',
};
const photoTheme: BackgroundTheme = {
  id: 'sky_milky_way',
  name: 'Milky Way',
  category: 'sky',
  imageSource: 1,
  isPremium: true,
};

describe('resolveCardBackground', () => {
  it('returns the gradient theme when no photo theme is selected', () => {
    const result = resolveCardBackground(purpleTheme, null, true);
    expect(result).toEqual({
      kind: 'gradient',
      colors: purpleTheme.colors,
      textColor: '#FFFFFF',
      subTextColor: 'rgba(255, 255, 255, 0.8)',
    });
  });

  it('uses the theme textColor override for light gradients', () => {
    const result = resolveCardBackground(whiteTheme, null, true);
    expect(result.textColor).toBe('#1F2937');
    expect(result.subTextColor).toBe('rgba(31, 41, 55, 0.7)');
  });

  it('returns the photo background for a premium user with a selected photo theme', () => {
    const result = resolveCardBackground(purpleTheme, photoTheme, true);
    expect(result).toEqual({
      kind: 'photo',
      imageSource: photoTheme.imageSource,
      textColor: '#FFFFFF',
      subTextColor: 'rgba(255, 255, 255, 0.8)',
    });
  });

  it('prefers the portrait share crop when the theme has one', () => {
    const result = resolveCardBackground(purpleTheme, { ...photoTheme, portraitImageSource: 2 }, true);
    expect(result.kind === 'photo' && result.imageSource).toBe(2);
  });

  it('falls back to the gradient for a non-premium user even with a photo theme selected', () => {
    const result = resolveCardBackground(purpleTheme, photoTheme, false);
    expect(result.kind).toBe('gradient');
  });
});

describe('pickShareCardTextTier', () => {
  // Mirrors ShareSheet's own formula at a representative ~390dp-wide phone
  // (cardWidth 342, CARD_ASPECT_RATIO 0.62 -> cardTargetHeight ~552):
  // textWidth = cardWidth - Spacing.xl*2 - Spacing.lg*2 - Spacing.md
  // heightBudget = cardTargetHeight - Spacing.xxl*2 - Spacing.xl*2 - 90
  const TEXT_WIDTH = 250;
  const HEIGHT_BUDGET = 350;

  it('picks the largest tier for a short ayah (e.g. 32:16, ~190 chars English)', () => {
    const tier = pickShareCardTextTier(
      {
        arabicText: 'تَتَجَافَىٰ جُنُوبُهُمْ عَنِ ٱلْمَضَاجِعِ يَدْعُونَ رَبَّهُمْ خَوْفًا وَطَمَعًا وَمِمَّا رَزَقْنَٰهُمْ يُنفِقُونَ',
        englishText:
          'Their sides forsake their beds; they call upon their Lord in fear and hope, and from what We have provided them, they spend.',
      },
      TEXT_WIDTH,
      HEIGHT_BUDGET,
    );
    expect(tier.arabicFontSize).toBe(24);
  });

  it('picks a smaller tier for a medium-length ayah than for a short one', () => {
    const shortTier = pickShareCardTextTier({ englishText: 'a'.repeat(100) }, TEXT_WIDTH, HEIGHT_BUDGET);
    const mediumTier = pickShareCardTextTier({ englishText: 'a'.repeat(500) }, TEXT_WIDTH, HEIGHT_BUDGET);
    expect(mediumTier.quoteFontSize).toBeLessThanOrEqual(shortTier.quoteFontSize);
  });

  it('falls back to the smallest tier rather than throwing for the longest ayah in the Quran (2:282, ~1300 chars each)', () => {
    const arabic2_282 = 'ا'.repeat(1213); // real length; content doesn't affect wrapping math
    const english2_282 = 'a'.repeat(1334);
    const tier = pickShareCardTextTier(
      { arabicText: arabic2_282, transliteration: 'x'.repeat(900), englishText: english2_282 },
      TEXT_WIDTH,
      HEIGHT_BUDGET,
    );
    // Smallest tier is still returned (never throws / never returns undefined) —
    // this is the "card grows past its target height" case, handled by the
    // caller, not by hiding any of the text.
    expect(tier.arabicFontSize).toBe(13);
  });

  it('never divides by zero or picks an undefined tier when nothing is visible', () => {
    const tier = pickShareCardTextTier({}, TEXT_WIDTH, HEIGHT_BUDGET);
    expect(tier.arabicFontSize).toBe(24);
  });
});

describe('buildShareText', () => {
  const content = {
    text: 'In the name of Allah, the Most Gracious, the Most Merciful.',
    source: 'Surah Al-Fatihah 1:1',
    arabicText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    transliteration: 'Bismillahir Rahmanir Raheem',
  };

  it('includes only the English text when only English is toggled on', () => {
    const result = buildShareText(content, {
      showEnglish: true,
      showArabic: false,
      showTransliteration: false,
    });
    expect(result).toBe(`“${content.text}”\n\n\n${content.source}\n\nShared via Sakina`);
  });

  it('includes Arabic and transliteration when toggled on', () => {
    const result = buildShareText(content, {
      showEnglish: true,
      showArabic: true,
      showTransliteration: true,
    });
    expect(result).toBe(
      `“${content.text}”\n\n${content.arabicText}\n(${content.transliteration})\n\n${content.source}\n\nShared via Sakina`,
    );
  });

  it('omits Arabic/transliteration lines when the content lacks them even if toggled on', () => {
    const result = buildShareText(
      { text: content.text, source: content.source },
      { showEnglish: true, showArabic: true, showTransliteration: true },
    );
    expect(result).toBe(`“${content.text}”\n\n\n${content.source}\n\nShared via Sakina`);
  });
});

describe('shareCardLayout', () => {
  // 342 = a 390dp-wide phone minus the sheet's Spacing.xl gutters.
  const WIDTH = 342;

  it('gives a photo card the aspect it is handed (the window\'s, from ShareSheet)', () => {
    expect(shareCardLayout(WIDTH, true, 2 / 3).cardTargetHeight).toBeCloseTo(513, 0);
    // 390 x 844 window: the card is as tall as the verse screen is, scaled to
    // the card's width, so `cover` crops the photo the same way.
    expect(shareCardLayout(WIDTH, true, 390 / 844).cardTargetHeight).toBeCloseTo((WIDTH * 844) / 390, 5);
  });

  it('uses CARD_ASPECT_RATIO for a gradient card', () => {
    expect(shareCardLayout(WIDTH, false, null).cardTargetHeight).toBeCloseTo(WIDTH / CARD_ASPECT_RATIO, 5);
  });

  it('falls back to CARD_ASPECT_RATIO when a photo card is given no aspect', () => {
    expect(shareCardLayout(WIDTH, true, null).cardTargetHeight).toBeCloseTo(WIDTH / CARD_ASPECT_RATIO, 5);
  });

  it('budgets text against the photo branch\'s tighter padding', () => {
    // previewCardPhoto + glassPanel padding (16 each side, twice) and
    // previewQuote's 12 margin each side; 90 for header/footer.
    const photo = shareCardLayout(WIDTH, true, 2 / 3);
    expect(photo.textWidth).toBe(WIDTH - 88);
    expect(photo.heightBudget).toBeCloseTo(513 - 64 - 90, 0);
    const gradient = shareCardLayout(WIDTH, false, null);
    expect(gradient.textWidth).toBe(WIDTH - 48 - 32 - 12);
  });

  // A short, wide card cannot hold a long verse: the same verse gets a
  // readable size on a 2:3 card but is pushed to the smallest tier on a 3:2
  // one. The photo card is window-shaped (taller than 2:3), so it is on the
  // safe side of this. (pickShareCardTextTier returns the smallest tier
  // whether or not it fits, so this cannot tell "fits at 11pt" from "card
  // will grow".)
  it('keeps 50:16 above the smallest tier on a 2:3 card, and drops it to the smallest on 3:2', () => {
    const verse = quranContent.find((c) => c.id === 'quran_50_16');
    expect(verse).toBeDefined();
    const visible = {
      arabicText: verse!.arabicText,
      transliteration: verse!.transliteration,
      englishText: verse!.englishTranslation,
    };
    const portrait = shareCardLayout(WIDTH, true, 2 / 3);
    const windowShaped = shareCardLayout(WIDTH, true, 390 / 844);
    const landscape = shareCardLayout(WIDTH, true, 3 / 2);
    const smallest = pickShareCardTextTier({ englishText: 'a'.repeat(5000) }, 100, 10);
    const portraitTier = pickShareCardTextTier(visible, portrait.textWidth, portrait.heightBudget);
    const landscapeTier = pickShareCardTextTier(visible, landscape.textWidth, landscape.heightBudget);
    const windowTier = pickShareCardTextTier(
      visible,
      windowShaped.textWidth,
      windowShaped.heightBudget,
    );
    expect(portraitTier.arabicFontSize).toBeGreaterThan(smallest.arabicFontSize);
    expect(windowTier.arabicFontSize).toBeGreaterThanOrEqual(portraitTier.arabicFontSize);
    expect(landscapeTier).toEqual(smallest);
  });
});

// shareCardLayout's text budget is only right while ShareSheet's styles use
// the same insets. This reads the stylesheet source, so it catches a literal
// typed back into one of those styles (the drift SHARE_CARD_INSETS exists to
// prevent). WHAT IT DOES NOT CATCH: a new padding added to some other style
// inside the card, which the budget would not know about either.
describe('ShareSheet styles use SHARE_CARD_INSETS', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../components/ShareSheet.tsx'), 'utf8');
  const styleBlock = (name: string): string => {
    const start = source.indexOf(`  ${name}: {\n`);
    expect(start).toBeGreaterThan(-1);
    return source.slice(start, source.indexOf('\n  },', start));
  };

  it.each([
    [
      'previewCard',
      [
        'paddingHorizontal: SHARE_CARD_INSETS.cardPaddingH',
        'paddingVertical: SHARE_CARD_INSETS.cardPaddingV',
      ],
    ],
    [
      'previewCardPhoto',
      [
        'paddingHorizontal: SHARE_CARD_INSETS.photoCardPadding',
        'paddingVertical: SHARE_CARD_INSETS.photoCardPadding',
      ],
    ],
    [
      'glassPanel',
      [
        'paddingHorizontal: SHARE_CARD_INSETS.photoPanelPadding',
        'paddingVertical: SHARE_CARD_INSETS.photoPanelPadding',
      ],
    ],
    ['previewQuote', ['marginHorizontal: SHARE_CARD_INSETS.quoteMarginH']],
  ])('%s', (name, expected) => {
    const block = styleBlock(name);
    for (const line of expected) expect(block).toContain(line);
  });

  // The preview is scaled by a wrapper OUTSIDE ViewShot, so the captured view
  // is never itself transformed. WHAT THIS DOES NOT CATCH: whether ViewShot
  // ignores an ancestor's transform on a given platform. That needs a saved
  // image from a device.
  it('scales the preview outside the captured view', () => {
    expect(styleBlock('previewScaleWrap')).toContain("transformOrigin: 'top left'");
    const wrap = source.indexOf('style={[\n                    styles.previewScaleWrap');
    const shot = source.indexOf('<ViewShot ref={viewShotRef}');
    expect(wrap).toBeGreaterThan(-1);
    expect(shot).toBeGreaterThan(wrap);
    // Nothing on the ViewShot tag itself.
    expect(source.slice(shot, source.indexOf('>', shot))).not.toMatch(/transform|scale/);
  });

  // The saved image must be a plain rectangle: rounded corners on the
  // captured card saved as transparent corners that some apps fill with black
  // or white. WHAT THIS DOES NOT CATCH: whether ViewShot on a given platform
  // really ignores a parent's clipping. That needs a saved image on a device.
  it('keeps the rounded corners outside the captured view', () => {
    expect(styleBlock('previewCard')).not.toContain('borderRadius');
    expect(styleBlock('previewCardClip')).toContain('borderRadius');
    const clip = source.indexOf('<View style={styles.previewCardClip}>');
    const shot = source.indexOf('<ViewShot ref={viewShotRef}');
    expect(clip).toBeGreaterThan(-1);
    expect(shot).toBeGreaterThan(clip);
  });

  // An absoluteFill'd photo drew at its intrinsic size on an Android device
  // (the card showed a ~1.8x zoom from the top-left). WHAT THIS DOES NOT
  // CATCH: whether the measured size is right, or that the device now frames
  // the photo like the verse screen. That needs a device.
  it('sizes the photo layer explicitly, not with absoluteFill', () => {
    const photoImages = source.match(/<Image\s+source=\{background\.imageSource\}[^>]*>/g) ?? [];
    expect(photoImages).toHaveLength(1);
    for (const tag of photoImages) {
      expect(tag).not.toContain('absoluteFill');
      expect(tag).toContain('photoLayerDims');
      // `cover`, like ImmersiveBackground: `contain` would show the whole
      // photo and no longer match the verse screen's framing.
      expect(tag).toContain('resizeMode="cover"');
    }
    // The card takes the window's shape, not the photo's.
    expect(source).toMatch(/isPhoto \? screenWidth \/ screenHeight : null/);
    // Remounting per photo is what makes onLayout re-measure when two photos
    // give the card the same size.
    expect(source).toMatch(
      /key=\{selectedPhotoTheme\?\.id\}\s+style=\{\[styles\.previewCard, styles\.previewCardPhoto/,
    );
  });
});

describe('quoteTranslation', () => {
  it('wraps a translation in curly quotes', () => {
    expect(quoteTranslation('And We are nearer to him than his jugular vein.')).toBe(
      '“And We are nearer to him than his jugular vein.”',
    );
  });

  // The bug seen on a device: 20:46 printed as "He said, "Do not fear. ...
  // I hear and I see."" with a doubled quote at the end.
  it('turns quotes inside the translation into single quotes (20:46)', () => {
    const verse = quranContent.find((c) => c.id === 'quran_20_46');
    expect(verse).toBeDefined();
    const out = quoteTranslation(verse!.englishTranslation);
    expect(out).not.toContain('"');
    expect(out).not.toMatch(/””|“‘“/);
    expect(out).toMatch(/^“He said, ‘Do not fear\./);
    expect(out.endsWith('’”')).toBe(true);
  });

  it('opens a quote at the very start, and after a bracket or dash', () => {
    expect(quoteTranslation('"Say, (it is) true."')).toBe('“‘Say, (it is) true.’”');
    expect(quoteTranslation('said—"Peace."')).toBe('“said—‘Peace.’”');
  });

  it('leaves apostrophes alone', () => {
    expect(quoteTranslation("Allah's mercy")).toBe("“Allah's mercy”");
  });

  // Every translation in the corpus: no straight double quote survives, and
  // the inner quotes still pair up (as many ‘ as ’).
  it('handles every translation in quranData', () => {
    for (const c of quranContent) {
      const out = quoteTranslation(c.englishTranslation);
      expect(out).not.toContain('"');
      const opens = (out.match(/‘/g) || []).length;
      // Straight apostrophes are left as they are, so every ’ is a closing
      // quote (the corpus has no curly apostrophes to confuse the count).
      const closes = (out.match(/’/g) || []).length;
      expect([c.id, opens]).toEqual([c.id, closes]);
    }
  });
});

// Behaviour: the on-screen preview shrinks a card that would fill the sheet,
// and leaves a short one alone. WHAT THIS DOES NOT CATCH: how the sheet lays
// out on a device, or that the saved image is unaffected by the scale.
describe('previewScale', () => {
  it('leaves a card that is short enough at full size', () => {
    expect(previewScale(427, 844)).toBe(1);
    expect(previewScale(0.6 * 844, 844)).toBe(1);
  });

  it('shrinks a window-shaped photo card to the preview budget', () => {
    // 390 x 844 window: the card is ~740dp, the budget 60% of 844.
    const cardHeight = (342 * 844) / 390;
    const s = previewScale(cardHeight, 844);
    expect(s).toBeLessThan(1);
    expect(cardHeight * s).toBeCloseTo(PREVIEW_MAX_HEIGHT_FRACTION * 844, 5);
  });

  it('keeps the preview inside the sheet with room for the controls', () => {
    // The sheet's scroll area is 92% of the window minus ~40 for the handle.
    const windows = [
      [390, 844],
      [412, 915],
      [360, 780],
      [430, 932],
    ];
    for (const [w, h] of windows) {
      const cardHeight = ((w - 48) * h) / w;
      const visible = 0.92 * h - 40;
      expect(cardHeight * previewScale(cardHeight, h)).toBeLessThan(visible - 100);
    }
  });

  it('is 1 when a size is missing or not positive', () => {
    expect(previewScale(0, 844)).toBe(1);
    expect(previewScale(700, 0)).toBe(1);
    expect(previewScale(NaN, 844)).toBe(1);
  });
});

// Behaviour, not source text: the measured size is used only for the photo it
// was measured with. WHAT THIS DOES NOT CATCH: whether onLayout reports the
// size the photo is actually drawn at on a device.
describe('photoLayerSize', () => {
  const fallback = { width: 300, height: 450 };
  const photoA = 101;
  const photoB = 202;

  it('uses the computed size before the card is measured', () => {
    expect(photoLayerSize(null, photoA, fallback)).toEqual(fallback);
  });

  it('uses the measured size for the photo it was measured with', () => {
    const measured = { source: photoA, width: 312, height: 470 };
    expect(photoLayerSize(measured, photoA, fallback)).toEqual({ width: 312, height: 470 });
  });

  it("does not carry one photo's measured size over to another photo", () => {
    const measured = { source: photoA, width: 312, height: 470 };
    expect(photoLayerSize(measured, photoB, fallback)).toEqual(fallback);
  });

  it('uses the computed size when no photo is showing', () => {
    const measured = { source: photoA, width: 312, height: 470 };
    expect(photoLayerSize(measured, null, fallback)).toEqual(fallback);
  });
});
