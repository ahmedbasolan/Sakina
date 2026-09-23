import {
  resolveCardBackground,
  buildShareText,
  pickShareCardTextTier,
  shareCardLayout,
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
    expect(result).toBe(`"${content.text}"\n\n\n${content.source}\n\nShared via Sakina`);
  });

  it('includes Arabic and transliteration when toggled on', () => {
    const result = buildShareText(content, {
      showEnglish: true,
      showArabic: true,
      showTransliteration: true,
    });
    expect(result).toBe(
      `"${content.text}"\n\n${content.arabicText}\n(${content.transliteration})\n\n${content.source}\n\nShared via Sakina`,
    );
  });

  it('omits Arabic/transliteration lines when the content lacks them even if toggled on', () => {
    const result = buildShareText(
      { text: content.text, source: content.source },
      { showEnglish: true, showArabic: true, showTransliteration: true },
    );
    expect(result).toBe(`"${content.text}"\n\n\n${content.source}\n\nShared via Sakina`);
  });
});

describe('shareCardLayout', () => {
  // 342 = a 390dp-wide phone minus the sheet's Spacing.xl gutters.
  const WIDTH = 342;

  it('gives a photo card its photo\'s own shape, so the photo fills it uncropped', () => {
    const { cardTargetHeight } = shareCardLayout(WIDTH, true, 2 / 3);
    expect(cardTargetHeight).toBeCloseTo(513, 0);
  });

  it('uses CARD_ASPECT_RATIO for a gradient card', () => {
    expect(shareCardLayout(WIDTH, false, null).cardTargetHeight).toBeCloseTo(WIDTH / CARD_ASPECT_RATIO, 5);
  });

  it('falls back to CARD_ASPECT_RATIO when a photo\'s size cannot be read', () => {
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

  // Why the landscape themes carry portrait crops: the same verse gets a
  // readable size on a 2:3 card but is pushed to the smallest tier on a 3:2
  // one. (pickShareCardTextTier returns the smallest tier whether or not it
  // fits, so this cannot tell "fits at 11pt" from "card will grow".)
  it('keeps 50:16 above the smallest tier on a 2:3 card, and drops it to the smallest on 3:2', () => {
    const verse = quranContent.find((c) => c.id === 'quran_50_16');
    expect(verse).toBeDefined();
    const visible = {
      arabicText: verse!.arabicText,
      transliteration: verse!.transliteration,
      englishText: verse!.englishTranslation,
    };
    const portrait = shareCardLayout(WIDTH, true, 2 / 3);
    const landscape = shareCardLayout(WIDTH, true, 3 / 2);
    const smallest = pickShareCardTextTier({ englishText: 'a'.repeat(5000) }, 100, 10);
    const portraitTier = pickShareCardTextTier(visible, portrait.textWidth, portrait.heightBudget);
    const landscapeTier = pickShareCardTextTier(visible, landscape.textWidth, landscape.heightBudget);
    expect(portraitTier.arabicFontSize).toBeGreaterThan(smallest.arabicFontSize);
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
});
