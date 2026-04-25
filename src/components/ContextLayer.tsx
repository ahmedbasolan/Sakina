import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/DesignSystem';
import ArabicText from './ArabicText';
import SourceChip from './SourceChip';
import { ContextBlock, SourceCitation } from '../types';

const { height } = Dimensions.get('window');

interface ContextLayerProps {
  blocks: ContextBlock[];
  scrollY?: Animated.Value;
}

/* ─── Decorative Quote Mark ─────────────────────────────────── */
function QuoteOrnament({ color }: { color: string }) {
  return (
    <Svg width={28} height={22} viewBox="0 0 28 22" style={{ opacity: 0.2 }}>
      <Path
        d="M0 22V13.2C0 10.6 0.5 8.3 1.5 6.3C2.5 4.3 4.2 2.3 6.5 0.5L9.5 3C7.7 4.5 6.4 6.1 5.6 7.8C4.8 9.5 4.4 11.3 4.4 13.2H8.5V22H0ZM15.5 22V13.2C15.5 10.6 16 8.3 17 6.3C18 4.3 19.7 2.3 22 0.5L25 3C23.2 4.5 21.9 6.1 21.1 7.8C20.3 9.5 19.9 11.3 19.9 13.2H24V22H15.5Z"
        fill={color}
      />
    </Svg>
  );
}

/* ─── Tafsir Block ──────────────────────────────────────────── */
function TafsirSection({ text, source }: { text: string; source: SourceCitation }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="book-open-variant" size={16} color={Colors.accent.secondary} />
        <Text style={styles.sectionLabel}>Tafsir</Text>
      </View>
      <View style={styles.textCard}>
        <Text style={styles.bodyText}>{text}</Text>
      </View>
      <View style={styles.chipRow}>
        <SourceChip citation={source} />
      </View>
    </View>
  );
}

/* ─── Hadith Block ──────────────────────────────────────────── */
function HadithSection({
  text,
  arabicText,
  transliteration,
  source,
}: {
  text: string;
  arabicText?: string;
  transliteration?: string;
  source: SourceCitation;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="heart-outline" size={16} color={Colors.accent.warm} />
        <Text style={[styles.sectionLabel, { color: Colors.accent.warm }]}>Prophetic Wisdom</Text>
      </View>
      <View style={styles.quoteCard}>
        <View style={styles.quoteCardInner}>
          <QuoteOrnament color={Colors.accent.secondary} />
          {arabicText ? <ArabicText text={arabicText} style={styles.hadithArabic} /> : null}
          {transliteration ? (
            <Text style={styles.hadithTransliteration}>{transliteration}</Text>
          ) : null}
          <Text style={styles.quoteText}>{text}</Text>
          <Text style={styles.quoteAttribution}>— Prophet Muhammad ﷺ</Text>
        </View>
      </View>
      <View style={styles.chipRow}>
        <SourceChip citation={source} />
      </View>
    </View>
  );
}

/* ─── Story Block ───────────────────────────────────────────── */
function StorySection({ text, citations }: { text: string; citations: SourceCitation[] }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="star-four-points-outline" size={16} color={Colors.accent.primary} />
        <Text style={[styles.sectionLabel, { color: Colors.accent.primary }]}>Story</Text>
      </View>
      <View style={styles.textCard}>
        <Text style={styles.bodyText}>{text}</Text>
      </View>
      <View style={styles.chipRow}>
        {citations.map((c, i) => (
          <SourceChip key={`${c.url}-${i}`} citation={c} />
        ))}
      </View>
    </View>
  );
}

/* ─── ContextLayer ──────────────────────────────────────────── */
const ContextLayer: React.FC<ContextLayerProps> = ({ blocks, scrollY }) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top + Spacing.sm, height * 0.02),
          paddingBottom: Math.max(insets.bottom + Spacing.sm, Spacing.xl),
        },
      ]}
    >
      <Animated.ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        fadingEdgeLength={40}
        scrollEventThrottle={16}
        onScroll={
          scrollY
            ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                useNativeDriver: true,
              })
            : undefined
        }
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {blocks.map((block, i) => {
            const key = `${block.kind}-${i}`;
            if (block.kind === 'tafsir') {
              return <TafsirSection key={key} text={block.text} source={block.source} />;
            }
            if (block.kind === 'hadith') {
              return (
                <HadithSection
                  key={key}
                  text={block.text}
                  arabicText={block.arabicText}
                  transliteration={block.transliteration}
                  source={block.source}
                />
              );
            }
            return <StorySection key={key} text={block.text} citations={block.citations} />;
          })}
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  scrollArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: Spacing.xxl, paddingTop: Spacing.sm },

  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
    paddingLeft: 4,
  },
  sectionLabel: {
    fontSize: 12,
    color: Colors.accent.secondary,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },

  textCard: {
    backgroundColor: 'rgba(255, 235, 210, 0.04)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 235, 210, 0.06)',
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 28,
    color: Colors.text.primary,
    fontFamily: Typography.fonts.serif,
    opacity: 0.9,
  },

  quoteCard: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  quoteCardInner: {
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.secondary,
    padding: Spacing.xl,
  },
  hadithArabic: {
    fontSize: 20,
    lineHeight: 38,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  hadithTransliteration: {
    fontFamily: Typography.fonts.serif,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(245, 237, 227, 0.55)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: Spacing.md,
  },
  quoteText: {
    fontFamily: Typography.fonts.serif,
    fontSize: 17,
    lineHeight: 28,
    color: Colors.text.primary,
    fontStyle: 'italic',
    marginTop: Spacing.md,
    opacity: 0.95,
  },
  quoteAttribution: {
    fontSize: 12,
    color: Colors.accent.secondary,
    fontWeight: '600',
    marginTop: Spacing.md,
    letterSpacing: 0.5,
    opacity: 0.7,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingLeft: 4,
  },
});

export default React.memo(ContextLayer);
