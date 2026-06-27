import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Colors, Spacing, BorderRadius, Typography, MoodColors } from '../theme/DesignSystem';
import { logServiceError } from '../services/errorLoggingService';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { AnimatedMandala } from '../components/AnimatedMandala';
import { TwinklingStar } from '../components/TwinklingStar';
import { dbQuery } from '../database/schema';

const { width } = Dimensions.get('window');

const STARS = [
  { x: '6%',  y: '4%',  size: 2.5, delay: 0 },
  { x: '91%', y: '6%',  size: 2,   delay: 500 },
  { x: '15%', y: '14%', size: 1.5, delay: 250 },
  { x: '83%', y: '10%', size: 2,   delay: 750 },
  { x: '49%', y: '7%',  size: 1.5, delay: 100 },
  { x: '94%', y: '22%', size: 2.5, delay: 600 },
  { x: '3%',  y: '32%', size: 1.5, delay: 350 },
];

// Derived from the design-system source of truth so dot colors always match
// the immersive screens the user is taken to.
const MOOD_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(MoodColors).map(([k, v]) => [k, v.accent])
);


const DAILY_PROMPTS = [
  { before: 'What brought you', highlight: 'peace', after: 'today?' },
  { before: 'What are you most', highlight: 'grateful', after: 'for right now?' },
  { before: 'What is weighing on your', highlight: 'heart', after: 'today?' },
  { before: 'Where do you need', highlight: 'sabr', after: 'this week?' },
  { before: 'What are you asking', highlight: 'Allah', after: 'for right now?' },
  { before: 'What moment gave you', highlight: 'hope', after: 'recently?' },
  { before: 'What do you want to', highlight: 'let go', after: 'of today?' },
];

function getTodayPrompt() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((+new Date() - +start) / 86400000);
  return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
}

// ── Entry row ────────────────────────────────────────────────────────
function ReflectionCard({ reflection, index, isLast }: { reflection: any; index: number; isLast: boolean }) {
  const moodColor = reflection.mood
    ? (MOOD_COLORS[reflection.mood] || Colors.accent.primary)
    : Colors.accent.primary;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: 60 + index * 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: 60 + index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const formatDate = (ts: number | string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity activeOpacity={0.7} style={styles.entryRow}>
        <View style={[styles.entryDot, { backgroundColor: moodColor }]} />
        <View style={styles.entryBody}>
          <View style={styles.entryTop}>
            <Text style={styles.entryTitle} numberOfLines={1}>
              {reflection.title || 'Reflection'}
            </Text>
            <Text style={styles.entryDate}>{formatDate(reflection.createdAt || Date.now())}</Text>
          </View>
          <Text style={styles.entryPreview} numberOfLines={2}>
            {reflection.content || reflection.text || ''}
          </Text>
        </View>
      </TouchableOpacity>
      {!isLast && <View style={styles.entrySep} />}
    </Animated.View>
  );
}

// ── New-reflection sheet ─────────────────────────────────────────────
const SHEET_MOODS = [
  { id: 'Grateful',    label: 'GRATEFUL',    color: '#34D399', icon: 'heart' },
  { id: 'Hopeful',     label: 'HOPEFUL',     color: '#FBBF24', icon: 'sunny' },
  { id: 'Calm',        label: 'PEACEFUL',    color: '#22D3EE', icon: 'water' },
  { id: 'Overwhelmed', label: 'OVERWHELMED', color: '#818CF8', icon: 'layers' },
  { id: 'Tired',       label: 'TIRED',       color: '#9CA3AF', icon: 'moon' },
  { id: 'Lonely',      label: 'LONELY',      color: '#A78BFA', icon: 'person' },
  { id: 'Sad',         label: 'SAD',         color: '#60A5FA', icon: 'rainy' },
  { id: 'Angry',       label: 'ANGRY',       color: '#F87171', icon: 'flame' },
] as const;

function NewReflectionModal({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (text: string, title: string, mood?: string) => void;
}) {
  const [titleText, setTitleText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const handleSave = () => {
    if (!bodyText.trim()) return;
    onSave(bodyText, titleText, selectedMood || undefined);
    setTitleText('');
    setBodyText('');
    setSelectedMood(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView
        style={styles.sheetWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.sm }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>NEW REFLECTION</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.sheetClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={18} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sheetSectionLabel}>MOOD</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodChipsRow}
          >
            {SHEET_MOODS.map((m) => {
              const active = selectedMood === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setSelectedMood(active ? null : m.id)}
                  activeOpacity={0.85}
                  style={[
                    styles.moodChip,
                    {
                      borderColor: active ? m.color : Colors.glass.border,
                      backgroundColor: active ? `${m.color}16` : Colors.glass.light,
                    },
                  ]}
                >
                  <Ionicons name={m.icon as any} size={14} color={m.color} />
                  <Text style={[styles.moodChipLabel, { color: m.color, opacity: active ? 1 : 0.7 }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TextInput
            style={styles.sheetTitleInput}
            placeholder="TITLE…"
            placeholderTextColor={`${Colors.text.primary}38`}
            value={titleText}
            onChangeText={setTitleText}
          />
          <TextInput
            style={styles.sheetBodyInput}
            placeholder="Write freely… this space is private, sacred, and only yours."
            placeholderTextColor={`${Colors.text.secondary}59`}
            value={bodyText}
            onChangeText={setBodyText}
            multiline
            textAlignVertical="top"
            autoFocus
          />
          <TouchableOpacity
            onPress={handleSave}
            disabled={!bodyText.trim()}
            activeOpacity={0.9}
            style={[styles.sheetSaveBtn, !bodyText.trim() && { opacity: 0.4 }]}
          >
            <Text style={styles.sheetSaveText}>SAVE REFLECTION</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Screen ───────────────────────────────────────────────────────────
export default function ReflectionHistoryScreen() {
  const insets = useSafeAreaInsets();
  const [reflections, setReflections] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const headerOpacity = useRef(new Animated.Value(0)).current;
  // Memoized with empty deps — re-evaluates only when the component unmounts
  // and remounts (e.g. tab switch the next day), not on every state update.
  const prompt = useMemo(() => getTodayPrompt(), []);

  useEffect(() => {
    Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    loadReflections();
  }, []);

  const loadReflections = async () => {
    try {
      const data = await dbQuery(async (db) => {
        const rows = await db.getAllAsync(
          `SELECT id, title, content, mood, createdAt FROM reflections ORDER BY createdAt DESC LIMIT 50`
        );
        return rows as any[];
      });
      setReflections(data);
    } catch (e) {
      logServiceError('ReflectionHistoryScreen', 'loadReflections', e instanceof Error ? e : new Error(String(e)));
      setReflections([]);
    }
  };

  const handleSaveReflection = async (text: string, title: string, mood?: string) => {
    try {
      const id = `reflection_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await dbQuery(async (db) => {
        await db.runAsync(
          `INSERT INTO reflections (id, title, content, mood, createdAt) VALUES (?, ?, ?, ?, ?)`,
          [id, title || 'Reflection', text, mood || null, Date.now()]
        );
      });
      loadReflections();
    } catch (e) {
      logServiceError('ReflectionHistoryScreen', 'saveReflection', e instanceof Error ? e : new Error(String(e)));
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.celestialWash}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {STARS.map((s, i) => (
        <TwinklingStar key={i} x={s.x} y={s.y} size={s.size} delay={s.delay} color={Colors.accent.primary} />
      ))}

      <View style={styles.mandalaWrap} pointerEvents="none">
        <AnimatedMandala size={270} color={Colors.accent.primary} opacity={0.12} />
      </View>

      {/* Header */}
      <Animated.View style={[styles.header, { paddingTop: insets.top + Spacing.lg, opacity: headerOpacity }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerPretitle}>BETWEEN YOU AND ALLAH</Text>
            <Text style={styles.headerTitle}>JOURNAL</Text>
          </View>
          <MaterialCommunityIcons
            name="lock"
            size={20}
            color={Colors.accent.primary}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          />
        </View>
        <BlurView intensity={10} tint="dark" style={styles.privacyBadge}>
          <MaterialCommunityIcons name="lock" size={11} color={`${Colors.accent.primary}B3`} />
          <Text style={styles.privacyText}>Encrypted · Local only · Never shared</Text>
        </BlurView>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing.xxxl * 2 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily prompt card */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => setShowModal(true)}>
          <BlurView intensity={14} tint="dark" style={styles.promptCard}>
            <LinearGradient
              colors={[`${Colors.accent.primary}14`, `${Colors.accent.primary}06`]}
              style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.xl }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.promptLabel}>REFLECT ON THIS</Text>
            <Text style={styles.promptText}>
              {prompt.before}{' '}
              <Text style={styles.promptHighlight}>{prompt.highlight}</Text>
              {' '}{prompt.after}
            </Text>
            <View style={styles.promptCTA}>
              <MaterialCommunityIcons name="pen-plus" size={14} color={Colors.background.primary} />
              <Text style={styles.promptCTAText}>Start Writing</Text>
            </View>
          </BlurView>
        </TouchableOpacity>

        {/* Entry list */}
        {reflections.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="notebook-heart-outline" size={52} color={`${Colors.accent.primary}40`} />
            <Text style={styles.emptyTitle}>Your journal is empty</Text>
            <Text style={styles.emptySub}>
              Every reflection is a step closer to Allah.{'\n'}Start writing today.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.pastLabel}>PAST ENTRIES</Text>
            <BlurView intensity={10} tint="dark" style={styles.entriesCard}>
              {reflections.map((r, i) => (
                <ReflectionCard key={r.id || i} reflection={r} index={i} isLast={i === reflections.length - 1} />
              ))}
            </BlurView>
          </>
        )}
      </ScrollView>

      <NewReflectionModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveReflection}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },

  mandalaWrap: {
    position: 'absolute',
    left: width / 2 - 135, top: 15, zIndex: 0,
  },

  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    zIndex: 2,
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: Spacing.md,
  },
  headerPretitle: {
    fontSize: Typography.sizes.detail - 2,
    color: `${Colors.accent.primary}99`,
    letterSpacing: 2.5, marginBottom: Spacing.xs,
    fontFamily: Typography.fonts.serif,
  },
  headerTitle: {
    fontSize: Typography.sizes.hero,
    color: Colors.text.primary,
    fontFamily: Typography.fonts.serif,
    fontWeight: '700', letterSpacing: 1.2,
    textShadowColor: `${Colors.accent.primary}33`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  privacyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderRadius: BorderRadius.md, overflow: 'hidden',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.glass.light,
    borderWidth: 1, borderColor: `${Colors.accent.primary}1F`,
    alignSelf: 'flex-start',
  },
  privacyText: {
    fontSize: Typography.sizes.detail - 1,
    color: `${Colors.accent.primary}99`,
    letterSpacing: 0.5,
  },

  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    gap: Spacing.lg,
  },

  // ── Prompt card ──────────────────────────────────────────────────
  promptCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${Colors.accent.primary}30`,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  promptLabel: {
    fontSize: Typography.sizes.detail - 2,
    color: `${Colors.accent.primary}99`,
    letterSpacing: 2,
    fontWeight: '700',
  },
  promptText: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.h2,
    color: Colors.text.primary,
    lineHeight: 30,
  },
  promptHighlight: {
    color: Colors.accent.primary,
    fontStyle: 'italic',
  },
  promptCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  promptCTAText: {
    fontSize: Typography.sizes.small,
    fontWeight: '700',
    color: Colors.background.primary,
    letterSpacing: 0.3,
  },

  // ── Entry list ───────────────────────────────────────────────────
  pastLabel: {
    fontSize: Typography.sizes.detail - 2,
    color: Colors.text.muted,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: -Spacing.xs,
  },
  entriesCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.glass.light,
  },
  entryDot: {
    width: 10, height: 10,
    borderRadius: 5,
    marginTop: 5,
    flexShrink: 0,
  },
  entryBody: { flex: 1 },
  entryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  entryTitle: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.sm,
  },
  entryDate: {
    fontSize: Typography.sizes.detail - 1,
    color: Colors.text.muted,
    letterSpacing: 0.3,
  },
  entryPreview: {
    fontSize: Typography.sizes.small - 1,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  entrySep: {
    height: 1,
    backgroundColor: Colors.glass.border,
    marginLeft: Spacing.lg + 10 + Spacing.md,
  },

  // ── Empty state ──────────────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyTitle: {
    fontSize: Typography.sizes.h2 - 1,
    color: `${Colors.text.primary}99`,
    fontFamily: Typography.fonts.serif,
    fontWeight: '600',
  },
  emptySub: {
    fontSize: Typography.sizes.small,
    color: Colors.text.secondary,
    textAlign: 'center', lineHeight: 22,
  },

  // ── Bottom sheet ─────────────────────────────────────────────────
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm + 2,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(167,139,250,0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44, height: 4,
    borderRadius: 2,
    backgroundColor: Colors.glass.heavy,
    marginBottom: Spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  sheetTitle: {
    fontSize: Typography.sizes.small,
    color: Colors.text.primary,
    fontFamily: Typography.fonts.serif,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  sheetClose: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.glass.light,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetSectionLabel: {
    fontSize: Typography.sizes.detail - 2,
    color: Colors.text.muted,
    letterSpacing: 1.8,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  moodChipsRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  moodChipLabel: {
    fontSize: Typography.sizes.detail - 2,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Typography.fonts.serif,
  },
  sheetTitleInput: {
    fontSize: Typography.sizes.small,
    color: Colors.text.primary,
    fontFamily: Typography.fonts.serif,
    fontWeight: '700',
    letterSpacing: 1.2,
    backgroundColor: Colors.glass.light,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  sheetBodyInput: {
    minHeight: 140,
    fontSize: Typography.sizes.body - 1,
    color: Colors.text.primary,
    lineHeight: 22,
    backgroundColor: Colors.glass.light,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sheetSaveBtn: {
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  sheetSaveText: {
    fontSize: Typography.sizes.small - 1,
    color: '#1A0F2E',
    fontWeight: '700',
    letterSpacing: 1.4,
  },
});
