import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Mood } from '../../types';
import { Colors } from '../../theme/DesignSystem';
import { getMoodsForTime } from '../../utils/moodTimeMapping';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 12) / 2;

interface MoodConfig {
  id: Mood;
  label: string;
  sublabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconName: string;
}

interface SmartMoodGridProps {
  moodConfigs: MoodConfig[];
  selectedMood: Mood | null;
  checkedInToday: boolean;
  onMoodPress: (mood: Mood) => void;
}

function SmartMoodCard({
  mood,
  isChecked,
  onPress,
  index,
}: {
  mood: MoodConfig;
  isChecked: boolean;
  onPress: () => void;
  index: number;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(index * 80),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, []);

  useEffect(() => {
    if (isChecked) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      glowAnim.setValue(0);
    }
  }, [isChecked]);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.92, friction: 3, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] });

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={[
          styles.card,
          {
            backgroundColor: mood.bgColor,
            borderColor: isChecked ? mood.color + '60' : mood.borderColor,
          },
        ]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: 16, backgroundColor: mood.color, opacity: glowOpacity },
          ]}
        />
        <View style={styles.cardRow}>
          <View style={[styles.iconCircle, { backgroundColor: mood.color + '16', borderColor: mood.color + '30' }]}>
            <Ionicons name={mood.iconName as any} size={20} color={mood.color} />
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardLabel, { color: mood.color }]}>
              {mood.label.charAt(0) + mood.label.slice(1).toLowerCase()}
            </Text>
            <Text
              style={[
                styles.cardSublabel,
                { color: mood.color, opacity: isChecked ? 0.75 : 0.45 },
              ]}
            >
              {mood.sublabel}
            </Text>
          </View>
        </View>
        {isChecked && (
          <View style={[styles.checkedBadge, { backgroundColor: mood.color }]}>
            <Ionicons name="checkmark" size={8} color={mood.bgColor} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function SmartMoodGrid({ moodConfigs, selectedMood, checkedInToday, onMoodPress }: SmartMoodGridProps) {
  const [expanded, setExpanded] = useState(false);
  const timeMoods = getMoodsForTime();

  const visibleMoods = expanded
    ? moodConfigs
    : moodConfigs.filter((m) => timeMoods.includes(m.id));

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.create(300, 'easeInEaseOut', 'opacity'));
    setExpanded(!expanded);
  };

  return (
    <View>
      <View style={styles.grid}>
        {visibleMoods.map((mood, idx) => (
          <SmartMoodCard
            key={mood.id}
            mood={mood}
            isChecked={selectedMood === mood.id}
            onPress={() => onMoodPress(mood.id)}
            index={idx}
          />
        ))}
      </View>
      <TouchableOpacity onPress={toggleExpand} style={styles.expandBtn}>
        <Text style={styles.expandText}>
          {expanded ? 'Show less' : 'See all 8'}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={12}
          color="#8BA4BF"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    minHeight: 80,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  cardText: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardSublabel: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    marginTop: 2,
  },
  checkedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
  },
  expandText: {
    fontSize: 13,
    color: '#8BA4BF',
    letterSpacing: 0.3,
  },
});
