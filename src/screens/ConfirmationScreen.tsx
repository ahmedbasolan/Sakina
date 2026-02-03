import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Mood } from '../types';

interface ConfirmationScreenProps {
  mood: Mood;
  islamicTerm: string;
  onGetGuidance: () => void;
  onBack: () => void;
}

const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({
  mood,
  islamicTerm,
  onGetGuidance,
  onBack,
}) => {
  const getFramingText = (selectedMood: Mood): string => {
    switch (selectedMood) {
      case 'Anxious':
        return "You've selected anxiety. The guidance shown will relate to reliance on Allah during uncertainty.";
      case 'Sad':
        return "You've selected sadness. The guidance shown will relate to finding patience through Allah's wisdom.";
      case 'Angry':
        return "You've selected anger. The guidance shown will relate to excellence in character through Allah's example.";
      case 'Grateful':
        return "You've selected gratitude. The guidance shown will relate to expressing thanks to Allah for His blessings.";
      case 'Happy':
        return "You've selected happiness. The guidance shown will relate to praising Allah for moments of joy.";
      case 'Hopeful':
        return "You've selected hope. The guidance shown will relate to placing trust in Allah's promises.";
      case 'Calm':
        return "You've selected calm. The guidance shown will relate to finding tranquility in Allah's presence.";
      default:
        return `You've selected ${mood.toLowerCase()}. The guidance shown will relate to this spiritual state.`;
    }
  };

  const getContextOptions = (selectedMood: Mood): string[] | null => {
    switch (selectedMood) {
      case 'Anxious':
        return ['General unease', 'Fear of outcome', 'Overthinking', 'Waiting'];
      case 'Sad':
        return ['Loss', 'Disappointment', 'Loneliness', 'Missing someone'];
      case 'Angry':
        return ['Injustice', 'Frustration', 'Betrayal', 'Disrespect'];
      case 'Grateful':
        return ['Family', 'Health', 'Opportunity', 'Simple blessing'];
      case 'Happy':
        return ['Achievement', 'Relationship', 'Good news', 'Peace'];
      case 'Hopeful':
        return ['New beginning', 'Future plan', 'Healing', 'Change'];
      case 'Calm':
        return ['After prayer', 'In nature', 'Quiet moment', 'Clarity'];
      default:
        return null;
    }
  };

  const contextOptions = getContextOptions(mood);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{mood}</Text>
          <Text style={styles.subtitle}>{islamicTerm}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Visual Anchor */}
      <View style={styles.visualAnchor}>
        <Text style={styles.icon}>☁️</Text>
      </View>

      {/* One-Line Framing */}
      <View style={styles.framingContainer}>
        <Text style={styles.framingText}>{getFramingText(mood)}</Text>
      </View>

      {/* Optional Context Selector */}
      {contextOptions && (
        <View style={styles.contextContainer}>
          <Text style={styles.contextLabel}>Optional: Refine your focus</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.contextScroll}
            contentContainerStyle={styles.contextContent}
          >
            {contextOptions.map((option, index) => (
              <TouchableOpacity key={index} style={styles.contextChip}>
                <Text style={styles.contextChipText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Primary Action */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.guidanceButton} onPress={onGetGuidance}>
          <Text style={styles.guidanceButtonText}>Get Guidance</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '300',
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'center',
    letterSpacing: 1,
  },
  placeholder: {
    width: 40,
  },
  visualAnchor: {
    alignItems: 'center',
    marginVertical: 40,
  },
  icon: {
    fontSize: 48,
    color: '#666666',
  },
  framingContainer: {
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  framingText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
  },
  contextContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  contextLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    textAlign: 'center',
    marginBottom: 16,
  },
  contextScroll: {
    flexGrow: 0,
  },
  contextContent: {
    paddingHorizontal: 10,
  },
  contextChip: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  contextChipText: {
    fontSize: 14,
    color: '#ffffff',
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  guidanceButton: {
    backgroundColor: '#60A5FA',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#60A5FA',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  guidanceButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ConfirmationScreen;
