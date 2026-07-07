import { resolveCardBackground, buildShareText, CardTheme } from '../shareCard';
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

  it('falls back to the gradient for a non-premium user even with a photo theme selected', () => {
    const result = resolveCardBackground(purpleTheme, photoTheme, false);
    expect(result.kind).toBe('gradient');
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
