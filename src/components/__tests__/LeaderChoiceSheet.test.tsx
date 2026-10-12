import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LeaderChoiceSheet } from '../LeaderChoiceSheet';

// No SafeAreaProvider in jest (jest.config.js only loads jest-native matchers),
// and useSafeAreaInsets throws without one.
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

it('shows the question, both answers and the privacy line', () => {
  const { getByText } = render(
    <LeaderChoiceSheet visible current={null} onChoose={jest.fn()} onClose={jest.fn()} />,
  );
  getByText('Who is leading?');
  getByText('A man');
  getByText('A woman, leading women');
  getByText('Stays on your device. Never sent to Sakina.');
});

it('reports the chosen answer', () => {
  const onChoose = jest.fn();
  const { getByText } = render(
    <LeaderChoiceSheet visible current={null} onChoose={onChoose} onClose={jest.fn()} />,
  );
  fireEvent.press(getByText('A woman, leading women'));
  expect(onChoose).toHaveBeenCalledWith('woman');
});
