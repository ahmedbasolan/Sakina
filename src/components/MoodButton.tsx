import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Mood } from '../types';

interface MoodButtonProps {
  mood: Mood;
  selected: boolean;
  onPress: () => void;
}

const MoodButton: React.FC<MoodButtonProps> = ({ mood, selected, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.button, selected && styles.selectedButton]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>{mood}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: 120,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#2d3748',
    borderColor: '#2d3748',
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: '#495057',
    textAlign: 'center',
  },
  selectedText: {
    color: '#ffffff',
  },
});

export default MoodButton;
