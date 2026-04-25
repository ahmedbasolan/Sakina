import React from 'react';
import { render } from '@testing-library/react-native';
import ContextLayer from '../ContextLayer';
import type { ContextBlock } from '../../types';

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: () => null,
  Ionicons: () => null,
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
  Path: () => null,
}));

describe('ContextLayer', () => {
  it('renders a tafsir block with its source chip', () => {
    const blocks: ContextBlock[] = [
      {
        kind: 'tafsir',
        text: "As-Sa'di explains that Allah promises ease alongside hardship.",
        source: { label: "Tafsir As-Sa'di", url: 'https://quran.com/94/5/tafsirs/170' },
      },
    ];
    const { getByText } = render(<ContextLayer blocks={blocks} />);
    expect(getByText(/As-Sa'di explains/)).toBeTruthy();
    expect(getByText(/Tafsir As-Sa'di/)).toBeTruthy();
  });

  it('renders a hadith block with arabic, transliteration, and grading', () => {
    const blocks: ContextBlock[] = [
      {
        kind: 'hadith',
        text: 'The Prophet \ufdfa said, "How wonderful is the affair of the believer..."',
        arabicText: '\u0639\u064e\u062c\u064e\u0628\u064b\u0627 \u0644\u0650\u0623\u064e\u0645\u0652\u0631\u0650 \u0627\u0644\u0652\u0645\u064f\u0624\u0652\u0645\u0650\u0646',
        transliteration: "'Ajaban li-amri al-mu'min",
        source: {
          label: 'Sahih Muslim 2999',
          url: 'https://sunnah.com/muslim:2999',
          grading: 'sahih',
        },
      },
    ];
    const { getByText } = render(<ContextLayer blocks={blocks} />);
    expect(getByText(/How wonderful/)).toBeTruthy();
    expect(getByText('\u0639\u064e\u062c\u064e\u0628\u064b\u0627 \u0644\u0650\u0623\u064e\u0645\u0652\u0631\u0650 \u0627\u0644\u0652\u0645\u064f\u0624\u0652\u0645\u0650\u0646')).toBeTruthy();
    expect(getByText(/'Ajaban/)).toBeTruthy();
    expect(getByText(/Sahih Muslim 2999/)).toBeTruthy();
  });

  it('renders a story block with multiple source chips', () => {
    const blocks: ContextBlock[] = [
      {
        kind: 'story',
        text: 'When Yunus AS was cast into the sea, he cried out from the darkness.',
        citations: [
          { label: 'Surah Al-Anbiya 21:87', url: 'https://quran.com/21/87' },
          { label: 'Sahih al-Bukhari 4622', url: 'https://sunnah.com/bukhari:4622' },
        ],
      },
    ];
    const { getByText } = render(<ContextLayer blocks={blocks} />);
    expect(getByText(/Yunus AS/)).toBeTruthy();
    expect(getByText(/21:87/)).toBeTruthy();
    expect(getByText(/Bukhari 4622/)).toBeTruthy();
  });

  it('renders multiple blocks in order', () => {
    const blocks: ContextBlock[] = [
      { kind: 'tafsir', text: 'FIRST_TAFSIR', source: { label: 'T1', url: 'https://x' } },
      { kind: 'hadith', text: 'SECOND_HADITH', source: { label: 'H1', url: 'https://y', grading: 'sahih' } },
    ];
    const { getByText } = render(<ContextLayer blocks={blocks} />);
    expect(getByText('FIRST_TAFSIR')).toBeTruthy();
    expect(getByText('SECOND_HADITH')).toBeTruthy();
  });
});
