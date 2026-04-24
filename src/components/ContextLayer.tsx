import React, { useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const { height } = Dimensions.get('window');
import Svg, { Path } from 'react-native-svg';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/DesignSystem';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ContextLayerProps {
  attribution: string;
  text: string;
  source: string;
  scrollY?: Animated.Value;
}

/**
 * Splits the tafsir text into two sections:
 * 1. "How to Understand This" - the scholarly explanation
 * 2. "Why It Matters" - the prophetic hadith / practical relevance
 */
function splitIntoSections(text: string): { understand: string; matters: string } {
  const splitPatterns = [
    /\.\s+The Prophet\s+ﷺ\s+said:/,
    /\.\s+The Prophet\s+ﷺ\s+would/,
    /\.\s+The Prophet\s+ﷺ\s+used to/,
    /\.\s+The Prophet\s+ﷺ\s+never/,
    /\.\s+The Prophet\s+ﷺ\s+himself/,
    /\.\s+The Prophet\s+ﷺ\s+was/,
    /\.\s+Your\s/,
    /\.\s+When you/,
    /\.\s+Despair/,
    /\.\s+Being an ally/,
    /\.\s+No sadness/,
    /\.\s+Even when/,
  ];

  for (const pattern of splitPatterns) {
    const match = text.match(pattern);
    if (match && match.index !== undefined) {
      const splitIndex = match.index + 1;
      return {
        understand: text.substring(0, splitIndex).trim(),
        matters: text.substring(splitIndex).trim(),
      };
    }
  }

  const sentences = text.split(/(?<=\.)\s+/);
  if (sentences.length >= 4) {
    const midpoint = Math.ceil(sentences.length * 0.6);
    return {
      understand: sentences.slice(0, midpoint).join(' ').trim(),
      matters: sentences.slice(midpoint).join(' ').trim(),
    };
  }

  return { understand: text, matters: '' };
}

/** Extracts a clean source label from the tafsir text */
function extractSourceLabel(text: string, fallbackSource: string): string {
  const match = text.match(/\[Tafsir\s+[^\]]+\]/);
  if (match) return match[0].replace(/[[\]]/g, '');
  if (fallbackSource && fallbackSource !== 'Quran') return fallbackSource;
  return 'Islamic Scholarship';
}

/** Detect and extract a prophetic quote if present */
function extractPropheticQuote(text: string): { before: string; quote: string; after: string } | null {
  // Match "The Prophet ﷺ said: "..." patterns
  const quoteMatch = text.match(
    /The Prophet\s+ﷺ\s+said:\s*["""]([^"""]+)["""]/,
  );
  if (quoteMatch && quoteMatch.index !== undefined) {
    const before = text.substring(0, quoteMatch.index).trim();
    const quote = quoteMatch[1].trim();
    const after = text.substring(quoteMatch.index + quoteMatch[0].length).trim();
    return { before, quote, after };
  }
  return null;
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

const ContextLayer: React.FC<ContextLayerProps> = ({ attribution, text, source, scrollY }) => {
  const insets = useSafeAreaInsets();
  const { understand, matters } = useMemo(() => splitIntoSections(text), [text]);
  const sourceLabel = useMemo(() => extractSourceLabel(text, source), [text, source]);
  const propheticQuote = useMemo(() => extractPropheticQuote(matters || text), [matters, text]);

  // Staggered fade-in for sections
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const slideAnim1 = useRef(new Animated.Value(12)).current;
  const slideAnim2 = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim1, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim1, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim2, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim2, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const cleanText = (t: string) =>
    t
      .replace(
        /\s*\[(?:Tafsir[^\]]*|Sahih[^\]]*|At-Tirmidhi[^\]]*|Abu Dawud[^\]]*|Musnad[^\]]*|Ibn[^\]]*|An-Nasa[^\]]*|Al-[^\]]*)\]\s*/g,
        ' ',
      )
      .trim();

  // For the "matters" section, if we extracted a prophetic quote, render it specially
  const renderMattersContent = () => {
    if (!propheticQuote) {
      return <Text style={styles.bodyText}>{cleanText(matters)}</Text>;
    }

    return (
      <>
        {propheticQuote.before ? (
          <Text style={styles.bodyText}>{cleanText(propheticQuote.before)}</Text>
        ) : null}

        {/* Prophetic Quote Callout */}
        <View style={styles.quoteCard}>
          <View style={styles.quoteCardInner}>
            <QuoteOrnament color={Colors.accent.secondary} />
            <Text style={styles.quoteText}>{propheticQuote.quote}</Text>
            <Text style={styles.quoteAttribution}>— Prophet Muhammad ﷺ</Text>
          </View>
        </View>

        {propheticQuote.after ? (
          <Text style={styles.bodyText}>{cleanText(propheticQuote.after)}</Text>
        ) : null}
      </>
    );
  };

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
        {/* Section 1: Scholarly Understanding */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnim1, transform: [{ translateY: slideAnim1 }] },
          ]}
        >
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="book-open-variant" size={16} color={Colors.accent.secondary} />
            <Text style={styles.sectionLabel}>
              {attribution || 'Scholarly Context'}
            </Text>
          </View>

          <View style={styles.textCard}>
            <Text style={styles.bodyText}>{cleanText(understand)}</Text>
          </View>
        </Animated.View>

        {/* Section 2: Why It Matters / Prophetic Wisdom */}
        {matters.length > 0 && (
          <Animated.View
            style={[
              styles.section,
              { opacity: fadeAnim2, transform: [{ translateY: slideAnim2 }] },
            ]}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="heart-outline" size={16} color={Colors.accent.warm} />
              <Text style={[styles.sectionLabel, { color: Colors.accent.warm }]}>
                Why It Matters
              </Text>
            </View>

            <View style={styles.textCard}>
              {renderMattersContent()}
            </View>
          </Animated.View>
        )}

        {/* Source Attribution */}
        <Animated.View style={[styles.sourceRow, { opacity: fadeAnim2 }]}>
          <View style={styles.sourceLine} />
          <View style={styles.sourceBadge}>
            <MaterialCommunityIcons name="shield-check" size={13} color={Colors.accent.primary} />
            <Text style={styles.sourceText}>{sourceLabel}</Text>
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.sm,
  },

  /* ── Sections ── */
  section: {
    marginBottom: Spacing.xl,
  },
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

  /* ── Text Card ── */
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

  /* ── Prophetic Quote Callout ── */
  quoteCard: {
    marginVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  quoteCardInner: {
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.secondary,
    padding: Spacing.xl,
    paddingLeft: Spacing.xl,
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

  /* ── Source ── */
  sourceRow: {
    marginTop: Spacing.md,
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  sourceLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(245, 237, 227, 0.08)',
    width: '100%',
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
  },
  sourceText: {
    fontSize: 12,
    color: 'rgba(245, 237, 227, 0.4)',
    fontWeight: '600',
    fontStyle: 'italic',
  },
});

export default React.memo(ContextLayer);
