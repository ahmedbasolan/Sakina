import React from 'react';
import { Linking } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import SourceChip from '../SourceChip';

describe('SourceChip', () => {
  const citation = { label: 'Sahih al-Bukhari 6363', url: 'https://sunnah.com/bukhari:6363' };

  it('renders the citation label', () => {
    const { getByText } = render(<SourceChip citation={citation} />);
    expect(getByText(/Sahih al-Bukhari 6363/)).toBeTruthy();
  });

  it('opens the URL via Linking when tapped', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { getByRole } = render(<SourceChip citation={citation} />);
    fireEvent.press(getByRole('link'));
    expect(openURL).toHaveBeenCalledWith(citation.url);
    openURL.mockRestore();
  });

  it('shows grading when provided (hadith)', () => {
    const { getByText } = render(
      <SourceChip citation={{ ...citation, grading: 'sahih' }} />,
    );
    expect(getByText(/Sahih/i)).toBeTruthy();
  });

  it('calls custom onPress if provided instead of Linking', () => {
    const onPress = jest.fn();
    const openURL = jest.spyOn(Linking, 'openURL');
    const { getByRole } = render(<SourceChip citation={citation} onPress={onPress} />);
    fireEvent.press(getByRole('link'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(openURL).not.toHaveBeenCalled();
    openURL.mockRestore();
  });
});
