/**
 * StoryLayer guards.
 *
 * Two behaviours are load-bearing and neither is visible to a typecheck:
 *
 *   1. The citation is always rendered. A story without its source is exactly
 *      what the sourcing rule exists to prevent, and an unsourced narrative
 *      beside scripture is the worst thing this app could ship.
 *   2. The settled state after a skip tap holds plain numbers. VerseLayer and
 *      HadithLayer both shipped a skipReveal that left text stuck near zero
 *      opacity — invisible until the screen was popped and re-entered.
 *
 * WHAT THIS DOES NOT CATCH: how it actually looks on a device. Contrast,
 * wrapping at real font scales, and whether the reveal reads as calm rather
 * than abrupt are all device checks.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import StoryLayer from '../StoryLayer';
import type { ContentStory } from '../../types';

const story: ContentStory = {
  title: 'The Well',
  body: 'A narrative body long enough to wrap across several lines on a phone.',
  source: 'Surah Yusuf 12:15-20',
  sourceType: 'quran_narrative',
};

describe('StoryLayer', () => {
  it('renders title, body and citation', () => {
    const { getByText } = render(<StoryLayer story={story} />);
    expect(getByText('The Well')).toBeTruthy();
    expect(getByText(/narrative body/)).toBeTruthy();
    expect(getByText('Surah Yusuf 12:15-20')).toBeTruthy();
  });

  it('never clamps the body with numberOfLines', () => {
    const { getByText } = render(<StoryLayer story={story} />);
    expect(getByText(/narrative body/).props.numberOfLines).toBeUndefined();
  });

  it('settles to plain opacity 1 after a skip tap', () => {
    const { getByTestId, getByText } = render(<StoryLayer story={story} />);
    fireEvent.press(getByTestId('story-skip'));
    const flatten = (s: unknown) =>
      (Array.isArray(s) ? Object.assign({}, ...s) : s) as Record<string, unknown>;
    expect(flatten(getByText('The Well').props.style).opacity).toBe(1);
    expect(flatten(getByText(/narrative body/).props.style).opacity).toBe(1);
  });

  // Exact match, not /Sahih/: the hadith source string is "Sahih al-Bukhari
  // 3339", so a loose matcher finds both the citation and the grading badge
  // and cannot tell you which one rendered.
  it('shows a grading only when the story carries one', () => {
    const { queryByText, rerender } = render(<StoryLayer story={story} />);
    expect(queryByText('Sahih')).toBeNull();
    rerender(
      <StoryLayer
        story={{
          ...story,
          sourceType: 'hadith_narrative',
          source: 'Sahih al-Bukhari 3339',
          grading: 'sahih',
        }}
      />,
    );
    expect(queryByText('Sahih')).toBeTruthy();
    expect(queryByText('Sahih al-Bukhari 3339')).toBeTruthy();
  });
});
