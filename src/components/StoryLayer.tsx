import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Animated, ScrollView, Pressable } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius, Animations } from '../theme/DesignSystem';
import type { ContentStory } from '../types';
import { useReduceMotion } from '../hooks/useReduceMotion';

interface StoryLayerProps {
  story: ContentStory;
  accentColor?: string;
  topInset?: number;
}

/**
 * Third guidance layer — the narrative a verse calls to mind.
 *
 * The staged reveal follows VerseLayer/HadithLayer, including the part those
 * two got wrong twice: a skip tap must not leave the settled state owned by an
 * Animated.Value. Three defences, and only the third is load-bearing — the
 * sequence is held in a ref and stopped before any write, the completion
 * callback is guarded on `finished`, and the styles are gated on
 * `revealComplete` so the settled render contains plain numbers and no
 * Animated node at all.
 *
 * There is deliberately no `scrollY` prop. ContextLayer takes one to drive an
 * animated header; this layer has none, and a prop that is declared, passed
 * and never read is how the next reader concludes the parallax is broken
 * rather than absent.
 */
export default function StoryLayer({
  story,
  accentColor = Colors.accent.primary,
  topInset = Spacing.lg,
}: StoryLayerProps) {
  const reduceMotion = useReduceMotion();
  const [revealComplete, setRevealComplete] = useState(reduceMotion);

  const titleAnim = useRef(new Animated.Value(0)).current;
  const bodyAnim = useRef(new Animated.Value(0)).current;
  const sourceAnim = useRef(new Animated.Value(0)).current;
  const sequence = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (reduceMotion) {
      setRevealComplete(true);
      return;
    }
    const fade = (v: Animated.Value, delay: number) =>
      Animated.timing(v, {
        toValue: 1,
        duration: Animations.timing.normal,
        delay,
        useNativeDriver: true,
      });

    sequence.current = Animated.parallel([
      fade(titleAnim, 0),
      fade(bodyAnim, Animations.timing.fast),
      fade(sourceAnim, Animations.timing.normal),
    ]);
    sequence.current.start(({ finished }) => {
      if (finished) setRevealComplete(true);
    });

    return () => {
      sequence.current?.stop();
    };
  }, [reduceMotion, titleAnim, bodyAnim, sourceAnim]);

  const skip = () => {
    sequence.current?.stop();
    titleAnim.setValue(1);
    bodyAnim.setValue(1);
    sourceAnim.setValue(1);
    setRevealComplete(true);
  };

  const gradingLabel = story.grading
    ? story.grading.charAt(0).toUpperCase() + story.grading.slice(1)
    : null;

  return (
    <Pressable testID="story-skip" onPress={skip} style={styles.flex}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topInset }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.Text style={[styles.title, { opacity: revealComplete ? 1 : titleAnim }]}>
          {story.title}
        </Animated.Text>

        <View style={[styles.rule, { backgroundColor: accentColor }]} />

        <Animated.Text style={[styles.body, { opacity: revealComplete ? 1 : bodyAnim }]}>
          {story.body}
        </Animated.Text>

        <Animated.View style={[styles.sourceRow, { opacity: revealComplete ? 1 : sourceAnim }]}>
          <Text style={[styles.source, { color: accentColor }]}>{story.source}</Text>
          {gradingLabel && <Text style={styles.grading}>{gradingLabel}</Text>}
        </Animated.View>
      </ScrollView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  title: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.h2,
    color: Colors.text.primary,
    lineHeight: Typography.sizes.h2 * 1.3,
  },
  rule: {
    width: 32,
    height: 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    opacity: 0.6,
  },
  body: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.body,
    color: Colors.text.secondary,
    lineHeight: Typography.sizes.body * 1.5,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  source: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
  },
  grading: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    color: Colors.text.muted,
  },
});
