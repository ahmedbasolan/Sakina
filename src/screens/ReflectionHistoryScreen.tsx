import React, { useState, useEffect, useRef } from 'react';
import { Colors, Spacing, BorderRadius, Typography, MoodColors, Layout } from '../theme/DesignSystem';
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
import { RotationEngine } from '../services/rotationEngine';

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

// Same icon set the mood grid/onboarding use per mood, plus Guilty (not
// offered in either of those pickers but reachable via Home's mood grid,
// so a saved verse-reflection can still carry it).
const MOOD_ICON: Record<string, string> = {
  Grateful: 'heart',
  Hopeful: 'sunny',
  Calm: 'water',
  Overwhelmed: 'layers',
  Tired: 'moon',
  Lonely: 'person',
  Sad: 'rainy',
  Angry: 'flame',
  Guilty: 'refresh-circle',
};

// One deliberate exception to the app's single-gold-accent rule, scoped to
// this screen's compose card only (owner decision, matches the reference
// design). Everything else on this screen stays gold/steel/cream.
const COMPOSE_ACCENT = '#A78BFA';

// ── Merged entry shape ──────────────────────────────────────────────────
// The journal combines two sources: freeform entries the user writes here
// (`reflections` table — no verse attached), and reflections saved while
// sitting with a verse in GuidanceScreen (`saved_reflections` — carries a
// Quran citation via the joined content row). RotationEngine.saveReflection
// already writes the latter; getSavedReflections() was defined but never
// surfaced anywhere in the app until now.
interface JournalEntry {
  id: string;
  title: string;
  body: string;
  mood?: string;
  createdAt: number;
  source?: string; // Quran citation — only present for verse-linked entries
}

// ── Entry card ───────────────────────────────────────────────────────
function ReflectionCard({ entry, index }: { entry: JournalEntry; index: number }) {
  const moodColor = entry.mood ? (MOOD_COLORS[entry.mood] || Colors.accent.primary) : null;
  const moodIcon = entry.mood ? MOOD_ICON[entry.mood] : null;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: 60 + index * 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: 60 + index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const tintColor = moodColor || Colors.accent.primary;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.entryCard, { borderColor: `${tintColor}40` }]}
        accessibilityRole="button"
        accessibilityLabel={`${entry.title}, ${formatDate(entry.createdAt)}`}
      >
        <LinearGradient colors={[Colors.background.secondary, Colors.background.primary]} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={[`${tintColor}1F`, `${tintColor}05`]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
        />
        <View style={styles.entryTop}>
          <Text style={styles.entryTitle} numberOfLines={1}>{entry.title}</Text>
          {moodColor && moodIcon && (
            <View style={[styles.entryMoodBadge, { backgroundColor: `${moodColor}26` }]}>
              <Ionicons name={moodIcon as any} size={13} color={moodColor} />
            </View>
          )}
        </View>
        <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
        <Text style={styles.entryPreview} numberOfLines={3}>{entry.body}</Text>
        {entry.source && (
          <View style={styles.entrySource}>
            <Ionicons name="book-outline" size={12} color={`${Colors.accent.primary}B3`} />
            <Text style={styles.entrySourceText}>{entry.source}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── New-reflection sheet ─────────────────────────────────────────────
const SHEET_MOODS = [
  { id: 'Grateful',    label: 'GRATEFUL' },
  { id: 'Hopeful',     label: 'HOPEFUL' },
  { id: 'Calm',        label: 'PEACEFUL' },
  { id: 'Overwhelmed', label: 'OVERWHELMED' },
  { id: 'Tired',       label: 'TIRED' },
  { id: 'Lonely',      label: 'LONELY' },
  { id: 'Sad',         label: 'SAD' },
  { id: 'Angry',       label: 'ANGRY' },
].map((m) => ({ ...m, color: MOOD_COLORS[m.id], icon: MOOD_ICON[m.id] }));

function NewReflectionModal({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (text: string, title: string, mood?: string) => void;
}) {
  const [titleText, setTitleText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const bodyRef = useRef<TextInput>(null);

  const handleSave = () => {
    if (!bodyText.trim()) return;
    onSave(bodyText, titleText, selectedMood || undefined);
    setTitleText('');
    setBodyText('');
    setSelectedMood(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      onShow={() => setTimeout(() => bodyRef.current?.focus(), 100)}
    >
      <KeyboardAvoidingView
        style={styles.sheetWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={0}
      >
        {/* Tappable backdrop — sits behind the sheet */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss new reflection"
        />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.sm }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>NEW REFLECTION</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.sheetClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
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
            keyboardShouldPersistTaps="handled"
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
                  accessibilityRole="button"
                  accessibilityLabel={m.label}
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons name={m.icon as any} size={14} color={m.color} />
                  <Text style={[styles.moodChipLabel, { color: m.color }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Inputs in a vertical scroll so they stay visible above the keyboard */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.sheetScrollArea}
            contentContainerStyle={styles.sheetScrollContent}
          >
            <TextInput
              style={styles.sheetTitleInput}
              placeholder="TITLE…"
              placeholderTextColor={`${Colors.text.primary}38`}
              value={titleText}
              onChangeText={setTitleText}
              returnKeyType="next"
              onSubmitEditing={() => bodyRef.current?.focus()}
              blurOnSubmit={false}
            />
            <TextInput
              ref={bodyRef}
              style={styles.sheetBodyInput}
              placeholder="Write freely… this space is private, sacred, and only yours."
              placeholderTextColor={`${Colors.text.secondary}59`}
              value={bodyText}
              onChangeText={setBodyText}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity
              onPress={handleSave}
              disabled={!bodyText.trim()}
              activeOpacity={0.9}
              style={[styles.sheetSaveBtn, !bodyText.trim() && { opacity: 0.4 }]}
              accessibilityRole="button"
              accessibilityLabel="Save reflection"
              accessibilityState={{ disabled: !bodyText.trim() }}
            >
              <Text style={styles.sheetSaveText}>SAVE REFLECTION</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Screen ───────────────────────────────────────────────────────────
export default function ReflectionHistoryScreen() {
  const insets = useSafeAreaInsets();
  const [reflections, setReflections] = useState<JournalEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    loadReflections();
  }, []);

  const loadReflections = async () => {
    try {
      const [freeform, saved] = await Promise.all([
        dbQuery(async (db) => {
          const rows = await db.getAllAsync(
            `SELECT id, title, content, mood, createdAt FROM reflections ORDER BY createdAt DESC LIMIT 50`
          );
          return rows as any[];
        }),
        RotationEngine.getInstance().getSavedReflections(),
      ]);

      const freeformEntries: JournalEntry[] = freeform.map((r) => ({
        id: r.id,
        title: r.title || 'Reflection',
        body: r.content || '',
        mood: r.mood || undefined,
        createdAt: r.createdAt,
      }));

      // No title is stored for verse-linked reflections — derive one from the
      // mood rather than inventing poetic copy the data doesn't back up.
      const verseEntries: JournalEntry[] = saved.map((r) => ({
        id: r.id,
        title: r.mood ? `${r.mood} Reflection` : 'Reflection',
        body: r.reflection,
        mood: r.mood,
        createdAt: r.timestamp,
        source: r.source,
      }));

      const merged = [...freeformEntries, ...verseEntries]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 50);
      setReflections(merged);
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
      await loadReflections();
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
        <Text style={styles.headerPretitle}>BETWEEN YOU AND ALLAH</Text>
        <Text style={styles.headerTitle}>Reflections</Text>
        <View style={styles.privacyRow}>
          <MaterialCommunityIcons name="lock" size={12} color={`${Colors.accent.primary}99`} />
          <Text style={styles.privacyText}>Encrypted · Local only · Never shared</Text>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Layout.tabBarClearance }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Compose CTA */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setShowModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Write a new reflection"
        >
          <BlurView intensity={14} tint="dark" style={styles.composeCard}>
            <LinearGradient
              colors={[`${COMPOSE_ACCENT}1F`, `${COMPOSE_ACCENT}08`]}
              style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.xl }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={[styles.composeIconCircle, { backgroundColor: `${COMPOSE_ACCENT}26` }]}>
              <Ionicons name="add" size={20} color={COMPOSE_ACCENT} />
            </View>
            <View style={styles.composeTextWrap}>
              <Text style={styles.composeTitle}>Write a New Reflection</Text>
              <Text style={styles.composeSubtitle}>A private space, just for you</Text>
            </View>
            <View style={[styles.composeIconCircle, { backgroundColor: `${COMPOSE_ACCENT}26` }]}>
              <MaterialCommunityIcons name="pen" size={16} color={COMPOSE_ACCENT} />
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
          <View style={styles.entriesList}>
            {reflections.map((r, i) => (
              <ReflectionCard key={r.id} entry={r} index={i} />
            ))}
          </View>
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
    marginBottom: Spacing.sm,
  },
  privacyRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
  },
  privacyText: {
    fontSize: Typography.sizes.detail - 1,
    color: Colors.text.muted,
    letterSpacing: 0.3,
  },

  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    gap: Spacing.lg,
  },

  // ── Compose CTA ──────────────────────────────────────────────────
  composeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${COMPOSE_ACCENT}40`,
    padding: Spacing.lg,
  },
  composeIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  composeTextWrap: { flex: 1, gap: 2 },
  composeTitle: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.body,
    fontWeight: '700',
    color: COMPOSE_ACCENT,
    letterSpacing: 0.3,
  },
  composeSubtitle: {
    fontSize: Typography.sizes.small - 1,
    color: Colors.text.secondary,
  },

  // ── Entry list ───────────────────────────────────────────────────
  entriesList: {
    gap: Spacing.md,
  },
  entryCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  entryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryTitle: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.small,
    color: Colors.accent.light,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    flex: 1,
    marginRight: Spacing.sm,
  },
  entryMoodBadge: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
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
    marginTop: Spacing.xs,
  },
  entrySource: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  entrySourceText: {
    fontSize: Typography.sizes.detail - 1,
    color: `${Colors.accent.primary}B3`,
    fontFamily: Typography.fonts.serif,
    letterSpacing: 0.3,
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
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
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
    maxHeight: '90%',
  },
  sheetScrollArea: {
    flexShrink: 1,
  },
  sheetScrollContent: {
    paddingBottom: Spacing.sm,
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
    fontSize: Typography.sizes.detail,
    fontWeight: '700',
    letterSpacing: 0.5,
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
