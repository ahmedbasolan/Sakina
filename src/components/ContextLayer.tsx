import React, { useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const { height } = Dimensions.get('window');
import Svg, { Path } from 'react-native-svg';
import { Colors, Spacing, Typography } from '../theme/DesignSystem';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { isolateBidiRuns } from '../utils/bidiText';

interface ContextLayerProps {
  attribution: string;
  text: string;
  source: string;
  angle?: string;
  angleSource?: string;
  scrollY?: Animated.Value;
  accentColor?: string;
  topInset?: number;
}

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

function extractSourceLabel(text: string, fallbackSource: string): string {
  const match = text.match(/\[Tafsir\s+[^\]]+\]/);
  if (match) return match[0].replace(/[[\]]/g, '');
  if (fallbackSource && fallbackSource !== 'Quran') return fallbackSource;
  return 'Islamic Scholarship';
}

function extractPropheticQuote(text: string): { before: string; quote: string; after: string } | null {
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

const ContextLayer: React.FC<ContextLayerProps> = ({
  attribution,
  text,
  source,
  angle,
  angleSource,
  scrollY,
  accentColor = Colors.accent.primary,
  topInset,
}) => {
  const insets = useSafeAreaInsets();
  const { understand, matters } = useMemo(() => splitIntoSections(text), [text]);
  const sourceLabel = useMemo(() => extractSourceLabel(text, source), [text, source]);
  const propheticQuote = useMemo(() => extractPropheticQuote(matters || text), [matters, text]);

  const fadeAnim1  = useRef(new Animated.Value(0)).current;
  const fadeAnim2  = useRef(new Animated.Value(0)).current;
  const fadeAnim3  = useRef(new Animated.Value(0)).current;
  const slideAnim1 = useRef(new Animated.Value(12)).current;
  const slideAnim2 = useRef(new Animated.Value(12)).current;
  const slideAnim3 = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    fadeAnim1.setValue(0);  slideAnim1.setValue(12);
    fadeAnim2.setValue(0);  slideAnim2.setValue(12);
    fadeAnim3.setValue(0);  slideAnim3.setValue(12);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim1,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim1, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim2,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim2, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim3,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim3, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, [text, angle]);

  const cleanText = (t: string) =>
    isolateBidiRuns(
      t
        .replace(
          /\s*\[(?:Tafsir[^\]]*|Sahih[^\]]*|At-Tirmidhi[^\]]*|Abu Dawud[^\]]*|Musnad[^\]]*|Ibn[^\]]*|An-Nasa[^\]]*|Al-[^\]]*)\]\s*/g,
          ' ',
        )
        .trim(),
    );

  const renderMattersContent = () => {
    if (!propheticQuote) {
      return <Text style={styles.bodyText}>{cleanText(matters)}</Text>;
    }

    return (
      <>
        {propheticQuote.before ? (
          <Text style={styles.bodyText}>{cleanText(propheticQuote.before)}</Text>
        ) : null}

        <View style={[styles.quoteCard, { borderLeftColor: accentColor }]}>
          <QuoteOrnament color={accentColor} />
          <Text style={styles.quoteText}>{isolateBidiRuns(propheticQuote.quote)}</Text>
          <Text style={[styles.quoteAttribution, { color: accentColor }]}>— Prophet Muhammad ﷺ</Text>
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
          paddingTop: topInset !== undefined
            ? topInset
            : Math.max(insets.top + Spacing.sm, height * 0.02),
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
        {/* Mood-tinted top rule — signals layer transition */}
        <View style={[styles.topRule, { backgroundColor: accentColor }]} />

        {/* Section 1: Scholarly understanding */}
        {understand.length > 0 && (
          <Animated.View
            style={[
              styles.section,
              { opacity: fadeAnim1, transform: [{ translateY: slideAnim1 }] },
            ]}
          >
            <View style={styles.sectionLead}>
              <MaterialCommunityIcons name="book-open-variant" size={13} color={accentColor} style={{ opacity: 0.7 }} />
              <Text style={[styles.sectionTag, { color: accentColor }]}>
                {attribution || 'Scholarly Context'}
              </Text>
            </View>
            <Text style={styles.bodyText}>{cleanText(understand)}</Text>
          </Animated.View>
        )}

        {/* Section 2: Prophetic wisdom */}
        {matters.length > 0 && (
          <Animated.View
            style={[
              styles.section,
              { opacity: fadeAnim2, transform: [{ translateY: slideAnim2 }] },
            ]}
          >
            {renderMattersContent()}
          </Animated.View>
        )}

        {/* Source attribution — footnote */}
        {understand.length > 0 && (
          <Animated.View style={[styles.attributionRow, { opacity: fadeAnim2 }]}>
            <MaterialCommunityIcons name="shield-check" size={11} color={accentColor} style={{ opacity: 0.55 }} />
            <Text style={styles.attributionText}>{sourceLabel}</Text>
          </Animated.View>
        )}

        {/* For Your Heart — left-border personal message card */}
        {angle ? (
          <Animated.View
            style={[
              styles.heartSection,
              { opacity: fadeAnim3, transform: [{ translateY: slideAnim3 }] },
            ]}
          >
            <View style={[styles.heartCard, { borderLeftColor: accentColor, backgroundColor: accentColor + '0D' }]}>
              <View style={styles.heartHeader}>
                <MaterialCommunityIcons name="heart-outline" size={13} color={accentColor} />
                <Text style={[styles.heartLabel, { color: accentColor }]}>For Your Heart</Text>
              </View>
              <Text style={styles.heartBody}>{isolateBidiRuns(angle)}</Text>
              {angleSource ? (
                <Text style={[styles.heartSource, { color: accentColor }]}>— {angleSource}</Text>
              ) : null}
            </View>
          </Animated.View>
        ) : null}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.sm,
  },

  /* ── Top accent rule ── */
  topRule: {
    height: 1.5,
    borderRadius: 1,
    marginBottom: Spacing.xl,
    opacity: 0.45,
  },

  /* ── Sections ── */
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTag: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    opacity: 0.75,
  },

  /* ── Body text — floats on immersive background ── */
  bodyText: {
    fontSize: 16,
    lineHeight: 28,
    color: Colors.text.primary,
    fontFamily: Typography.fonts.serif,
    opacity: 0.9,
  },

  /* ── Prophetic quote callout ── */
  quoteCard: {
    marginVertical: Spacing.lg,
    borderLeftWidth: 3,
    paddingLeft: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingRight: Spacing.sm,
  },
  quoteText: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.body,
    lineHeight: 28,
    color: Colors.text.primary,
    fontStyle: 'italic',
    marginTop: Spacing.md,
    opacity: 0.95,
  },
  quoteAttribution: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: Spacing.md,
    letterSpacing: 0.5,
    opacity: 0.7,
  },

  /* ── Source attribution footnote ── */
  attributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingLeft: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  attributionText: {
    fontSize: 11,
    color: `${Colors.text.primary}59`,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },

  /* ── For Your Heart ── */
  heartSection: {
    marginTop: Spacing.xl,
  },
  heartCard: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.xl,
    paddingVertical: Spacing.lg,
    paddingRight: Spacing.md,
  },
  heartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  heartLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  heartBody: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.body,
    lineHeight: 30,
    color: Colors.text.primary,
    fontStyle: 'italic',
    opacity: 0.9,
  },
  heartSource: {
    fontSize: 11,
    opacity: 0.55,
    fontWeight: '500',
    marginTop: Spacing.md,
    letterSpacing: 0.4,
    fontStyle: 'italic',
  },
});

export default React.memo(ContextLayer);
