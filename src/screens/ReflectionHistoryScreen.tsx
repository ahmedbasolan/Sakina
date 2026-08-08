import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Colors, Spacing, BorderRadius, Typography, MoodColors, Layout } from '../theme/DesignSystem';
import { logServiceError } from '../services/errorLoggingService';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  Animated,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  UIManager,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { AnimatedMandala } from '../components/AnimatedMandala';
import { TwinklingStar } from '../components/TwinklingStar';
import { dbQuery } from '../database/schema';
import { RotationEngine } from '../services/rotationEngine';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { MOOD_ICON } from '../constants/moodIcons';
import { Mood } from '../types';

// Legacy-architecture Android requires this opt-in for LayoutAnimation
// (used below for the mood capsule's icon-to-label expand); a no-op if the
// New Architecture already supports it or on iOS.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

// One deliberate exception to the app's single-gold-accent rule, scoped to
// this screen's compose card only (owner decision, matches the reference
// design). Everything else on this screen stays gold/steel/cream.
const COMPOSE_ACCENT = '#A78BFA';

// ── Merged entry shape ──────────────────────────────────────────────────
// This screen is reflections only — things the user actually wrote, whether
// freeform (`reflections` table) or attached to a verse while sitting with
// it in Guidance/a Journey (`saved_reflections` where reflection != ''). A
// verse bookmarked with no note attached is a saved verse, not a reflection
// — it lives in the Quran Library's Saved Verses tab instead (see
// LibraryScreen.tsx), same as a verse bookmarked while reading.
interface JournalEntry {
  id: string;
  title: string;
  body: string;
  mood?: string;
  createdAt: number;
  source?: string; // Quran citation — only present for verse-linked entries
}

// ── Entry card ───────────────────────────────────────────────────────
// Memoised: the list is virtualised, so every scroll re-renders the parent and
// would otherwise re-render every mounted card. `onSelect` is a stable
// useCallback in the parent rather than an inline arrow, which is what makes
// the memo actually hold.
const ReflectionCard = React.memo(function ReflectionCard({
  entry,
  index,
  onSelect,
}: { entry: JournalEntry; index: number; onSelect: (e: JournalEntry) => void }) {
  const moodColor = entry.mood ? (MOOD_COLORS[entry.mood] || Colors.accent.primary) : null;
  const moodIcon = entry.mood ? MOOD_ICON[entry.mood as Mood] : null;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const onPress = useCallback(() => onSelect(entry), [onSelect, entry]);

  useEffect(() => {
    // Stagger is capped: under a ScrollView every card mounted at once and the
    // ladder read as one entrance. A FlatList mounts them as they scroll in, so
    // an uncapped index * 60 would leave entry 200 invisible for 12 seconds.
    const delay = 60 + Math.min(index, 6) * 60;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
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
        onPress={onPress}
        style={[styles.entryCard, { borderColor: `${tintColor}40` }]}
        accessibilityRole="button"
        accessibilityLabel={`${entry.title}, ${formatDate(entry.createdAt)}. Double tap to open.`}
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
});

const EntrySeparator = () => <View style={styles.entrySeparator} />;

// ── Reflection detail ────────────────────────────────────────────────
// Read-only — cards weren't tappable at all before, so a viewer that shows
// the untruncated title/body/citation is the fix; editing wasn't requested.
function ReflectionDetailModal({ entry, onClose }: { entry: JournalEntry | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const moodColor = entry?.mood ? (MOOD_COLORS[entry.mood] || Colors.accent.primary) : null;
  const moodIcon = entry?.mood ? MOOD_ICON[entry.mood as Mood] : null;
  const tintColor = moodColor || Colors.accent.primary;

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <Modal visible={!!entry} animationType="none" transparent onRequestClose={onClose}>
      <View style={styles.sheetWrap}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close reflection"
        />
        {entry && (
          <View style={[styles.sheet, { maxHeight: '80%', paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.sm }]}>
            <LinearGradient
              colors={[`${tintColor}14`, 'transparent']}
              style={[StyleSheet.absoluteFill, { borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl }]}
              pointerEvents="none"
            />
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.detailHeaderLeft}>
                {moodColor && moodIcon && (
                  <View style={[styles.entryMoodBadge, { backgroundColor: `${moodColor}26` }]}>
                    <Ionicons name={moodIcon as any} size={13} color={moodColor} />
                  </View>
                )}
                <Text style={[styles.sheetTitle, { color: tintColor }]} numberOfLines={1}>
                  {entry.title.toUpperCase()}
                </Text>
              </View>
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
            <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: Spacing.lg }}>
              <Text style={styles.detailBody}>{entry.body || 'No content was saved for this reflection.'}</Text>
              {entry.source && (
                <View style={[styles.entrySource, { marginTop: Spacing.xl }]}>
                  <Ionicons name="book-outline" size={13} color={`${Colors.accent.primary}B3`} />
                  <Text style={styles.entrySourceText}>{entry.source}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
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
].map((m) => ({ ...m, color: MOOD_COLORS[m.id], icon: MOOD_ICON[m.id as Mood] }));

function NewReflectionModal({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (text: string, title: string, mood?: string) => void;
}) {
  const [titleText, setTitleText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const bodyRef = useRef<TextInput>(null);
  const reduceMotion = useReduceMotion();

  const activeMood = SHEET_MOODS.find((m) => m.id === selectedMood);
  const themeColor = activeMood?.color || COMPOSE_ACCENT;

  // Reclaim vertical space for the title/body inputs while the keyboard is
  // up by collapsing the MOOD row — it's only needed before/after typing;
  // the mood is already visible everywhere else (border, title, Save button
  // all themed to it), so hiding the picker itself loses no information.
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = () => {
      if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardVisible(true);
    };
    const onHide = () => {
      if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardVisible(false);
    };
    const showSub = Keyboard.addListener(showEvt, onShow);
    const hideSub = Keyboard.addListener(hideEvt, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [reduceMotion]);

  const handleSelectMood = (id: string) => {
    // easeInEaseOut, not a spring/bounce preset — the capsule's icon→label
    // expand should read as one smooth resize, not settle with an overshoot.
    // Skipped entirely under reduce-motion: the capsule just jumps to its
    // new size instead of resizing.
    if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedMood((prev) => (prev === id ? null : id));
  };

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
      animationType="none"
      transparent
      onRequestClose={onClose}
      onShow={() => bodyRef.current?.focus()}
    >
      {/*
        `behavior="padding"` on both platforms is deliberate, not a leftover
        dead ternary — Android's windowSoftInputMode adjustResize does NOT
        apply here because a transparent Modal renders in its own Dialog
        window, separate from the Activity, so nothing repositions this sheet
        unless KeyboardAvoidingView does it itself. (An earlier pass here
        swapped Android to `undefined` on the theory that adjustResize would
        handle it — it doesn't for Modal content, and that left the keyboard
        simply covering the bottom of the sheet with nothing pushing it up.)
        The mood-row illegibility bug was actually caused by animationType
        "slide" racing a setTimeout-delayed auto-focus, not by this line —
        fixed below via animationType="none" and an immediate, un-delayed focus.
      */}
      <KeyboardAvoidingView
        style={styles.sheetWrap}
        behavior="padding"
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

        <View style={[styles.sheet, { borderColor: `${themeColor}30`, paddingBottom: insets.bottom + Spacing.md }]}>
          <LinearGradient
            colors={[`${themeColor}14`, 'transparent']}
            style={[StyleSheet.absoluteFill, { borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl }]}
            pointerEvents="none"
          />
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: themeColor }]}>NEW REFLECTION</Text>
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

          {/* Collapsed while the keyboard is up (see the effect above) to give
              the title/body inputs the space they actually need — the chosen
              mood stays visible everywhere else in the sheet's theming. */}
          {!keyboardVisible && (
            <>
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
                      onPress={() => handleSelectMood(m.id)}
                      activeOpacity={0.85}
                      style={[
                        styles.moodCapsule,
                        {
                          borderColor: active ? m.color : `${m.color}40`,
                          backgroundColor: active ? m.color : `${m.color}1F`,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={m.label}
                      accessibilityState={{ selected: active }}
                    >
                      <Ionicons name={m.icon as any} size={16} color={active ? '#FFFFFF' : m.color} />
                      {active && (
                        <Text style={styles.moodCapsuleLabel}>{m.label}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* Inputs in a vertical scroll; Save stays outside this scroll so
              it's always pinned at the bottom of the sheet — which itself
              sits above the keyboard via the KeyboardAvoidingView above —
              instead of requiring a scroll to reach it. */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.sheetScrollArea}
            contentContainerStyle={styles.sheetScrollContent}
          >
            <TextInput
              style={[styles.sheetTitleInput, { color: themeColor }]}
              placeholder="TITLE…"
              placeholderTextColor={`${themeColor}55`}
              value={titleText}
              onChangeText={setTitleText}
              returnKeyType="next"
              onSubmitEditing={() => bodyRef.current?.focus()}
              blurOnSubmit={false}
            />
            <TextInput
              ref={bodyRef}
              style={[styles.sheetBodyInput, keyboardVisible && { minHeight: 90 }]}
              placeholder="Write freely — even a few words count"
              placeholderTextColor={`${Colors.text.secondary}59`}
              value={bodyText}
              onChangeText={setBodyText}
              multiline
              textAlignVertical="top"
            />
          </ScrollView>

          <TouchableOpacity
            onPress={handleSave}
            disabled={!bodyText.trim()}
            activeOpacity={0.9}
            style={[
              styles.sheetSaveBtn,
              { backgroundColor: themeColor, shadowColor: themeColor },
              !bodyText.trim() && { opacity: 0.4 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Save reflection"
            accessibilityState={{ disabled: !bodyText.trim() }}
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
  const [reflections, setReflections] = useState<JournalEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const headerOpacity = useRef(new Animated.Value(0)).current;

  // Stable across renders so React.memo on ReflectionCard is not defeated by a
  // fresh closure on every scroll frame.
  const handleSelect = useCallback((entry: JournalEntry) => setSelectedEntry(entry), []);
  const renderEntry = useCallback(
    ({ item, index }: { item: JournalEntry; index: number }) => (
      <ReflectionCard entry={item} index={index} onSelect={handleSelect} />
    ),
    [handleSelect],
  );

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
      // Bookmark-marker rows (reflection === '', saved with no note attached)
      // are excluded entirely — those are saved verses, not reflections, and
      // live in the Quran Library's Saved Verses tab instead.
      const verseEntries: JournalEntry[] = saved
        .filter((r) => r.reflection?.trim())
        .map((r) => ({
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

      {/* FlatList, not ScrollView + .map: every entry used to mount at once, so
          the screen's cost grew with the size of the journal — the one list in
          the app that only ever gets longer. */}
      <FlatList
        data={reflections}
        keyExtractor={(r) => r.id}
        renderItem={renderEntry}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Layout.tabBarClearance }]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={EntrySeparator}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="notebook-heart-outline" size={52} color={`${Colors.accent.primary}40`} />
            <Text style={styles.emptyTitle}>Your journal is empty</Text>
            <Text style={styles.emptySub}>
              Nothing here yet.{'\n'}The first entry is usually the hardest.
            </Text>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.composeHeader}>
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
          </View>
        }
      />

      <NewReflectionModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveReflection}
      />
      <ReflectionDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },

  mandalaWrap: {
    position: 'absolute',
    alignSelf: 'center', top: 15, zIndex: 0,
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
    // No `gap` here any more. Under the old ScrollView it spaced the compose
    // card from the entry block; a FlatList would apply it between header,
    // every row and the footer, double-spacing against ItemSeparatorComponent.
    // Header margin and the separator carry it explicitly instead.
  },
  composeHeader: {
    marginBottom: Spacing.lg,
  },
  entrySeparator: {
    height: Spacing.md,
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
  detailHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 1,
  },
  detailBody: {
    fontSize: Typography.sizes.body - 1,
    color: Colors.text.primary,
    lineHeight: 24,
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
  // flexGrow: 0 is deliberate, not redundant with flexShrink — pinned here so
  // this ScrollView can never expand past its own content height and leave
  // dead space between the inputs and the Save button below it.
  sheetScrollArea: {
    flexGrow: 0,
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
  // Icon-only circle by default (~36pt, near-square via symmetric padding);
  // gains a label + extra horizontal padding only once selected, and
  // LayoutAnimation (see handleSelectMood) animates that width change.
  moodCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 36,
    paddingHorizontal: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  moodCapsuleLabel: {
    fontSize: Typography.sizes.detail,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Typography.fonts.serif,
    color: '#FFFFFF',
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
    marginBottom: Spacing.md,
  },
  sheetSaveBtn: {
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
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
