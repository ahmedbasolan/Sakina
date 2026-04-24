/**
 * ReflectionHistoryScreen (Journal)
 *
 * Dark navy redesign matching the reference image:
 * Background: #07111E → #0C1A2E gradient
 * Twinkling gold stars, mandala backdrop, gold accents.
 * "BETWEEN YOU AND ALLAH" / "REFLECTIONS" title.
 * Privacy badge. Dark glass reflection cards.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Colors } from '../theme/DesignSystem';
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
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { AnimatedMandala } from '../components/AnimatedMandala';
import { dbQuery } from '../database/schema';

const { width, height } = Dimensions.get('window');

const STARS = [
  { x: 0.06, y: 0.04, s: 2.5, d: 0 },
  { x: 0.91, y: 0.06, s: 2, d: 500 },
  { x: 0.15, y: 0.14, s: 1.5, d: 250 },
  { x: 0.83, y: 0.10, s: 2, d: 750 },
  { x: 0.49, y: 0.07, s: 1.5, d: 100 },
  { x: 0.94, y: 0.22, s: 2.5, d: 600 },
  { x: 0.03, y: 0.32, s: 1.5, d: 350 },
];

const MOOD_COLORS: Record<string, string> = {
  Grateful: '#34D399', Hopeful: '#FBBF24', Calm: '#22D3EE',
  Overwhelmed: '#818CF8', Sad: '#60A5FA', Angry: '#F87171',
  Lonely: '#A78BFA', Guilty: '#34D399', Tired: '#9CA3AF',
};

const MOOD_ICONS: Record<string, string> = {
  Grateful: 'heart', Hopeful: 'star', Calm: 'leaf',
  Overwhelmed: 'alert-circle', Sad: 'water', Angry: 'flame',
  Lonely: 'person', Guilty: 'refresh-circle', Tired: 'moon',
};

function TwinklingStar({ x, y, s: size, d: delay }: any) {
  const opacity = useRef(new Animated.Value(0.15)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 0.85, duration: 1400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.15, duration: 1400, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x * width, top: y * height * 0.4,
        width: size, height: size,
        borderRadius: size / 2,
        backgroundColor: Colors.accent.primary,
        opacity, zIndex: 1,
      }}
    />
  );
}

function ReflectionCard({ reflection, index }: { reflection: any; index: number }) {
  const moodColor = reflection.mood ? (MOOD_COLORS[reflection.mood] || Colors.accent.primary) : Colors.accent.primary;
  const moodIcon = reflection.mood ? (MOOD_ICONS[reflection.mood] || 'sparkles') : 'pen';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 450, delay: 80 + index * 70, useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0, friction: 8, tension: 80, delay: 80 + index * 70, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const formatDate = (ts: number | string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <BlurView intensity={12} tint="dark" style={styles.reflectionCard}>
        <View style={[styles.cardAccentBar, { backgroundColor: moodColor }]} />
        <View style={styles.cardBody}>
          {/* Header row */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {reflection.title || 'Reflection'}
              </Text>
              <Text style={styles.cardDate}>{formatDate(reflection.createdAt || Date.now())}</Text>
            </View>
            {/* Mood icon top-right */}
            {reflection.mood && (
              <View style={[styles.moodBadge, { backgroundColor: `${moodColor}18`, borderColor: `${moodColor}30` }]}>
                <Ionicons name={moodIcon as any} size={14} color={moodColor} />
                <Text style={[styles.moodBadgeText, { color: moodColor }]}>{reflection.mood}</Text>
              </View>
            )}
          </View>

          {/* Preview text */}
          <Text style={styles.cardPreview} numberOfLines={3}>
            {reflection.content || reflection.text || ''}
          </Text>

          {/* Footer: verse link + chevron */}
          <View style={styles.cardFooter}>
            {reflection.verseRef ? (
              <View style={styles.verseRef}>
                <MaterialCommunityIcons name="book-open-variant" size={12} color="rgba(201,168,76,0.6)" />
                <Text style={styles.verseRefText}>{reflection.verseRef}</Text>
              </View>
            ) : (
              <View />
            )}
            <MaterialCommunityIcons name="chevron-right" size={16} color="rgba(201,168,76,0.35)" />
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
}

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

// New Reflection bottom sheet
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
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.sheetBackdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      <KeyboardAvoidingView
        style={styles.sheetWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          {/* Handle */}
          <View style={styles.sheetHandle} />

          {/* Header row: title + X close */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>NEW REFLECTION</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.sheetClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={18} color="rgba(240,230,211,0.7)" />
            </TouchableOpacity>
          </View>

          {/* Mood chip row */}
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
                      borderColor: active ? m.color : 'rgba(255,255,255,0.08)',
                      backgroundColor: active ? `${m.color}16` : 'rgba(255,255,255,0.02)',
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

          {/* Title input */}
          <TextInput
            style={styles.sheetTitleInput}
            placeholder="TITLE…"
            placeholderTextColor="rgba(240,230,211,0.35)"
            value={titleText}
            onChangeText={setTitleText}
          />

          {/* Body input */}
          <TextInput
            style={styles.sheetBodyInput}
            placeholder="Write freely… this space is private, sacred, and only yours."
            placeholderTextColor="rgba(176,196,215,0.35)"
            value={bodyText}
            onChangeText={setBodyText}
            multiline
            textAlignVertical="top"
            autoFocus
          />

          {/* Save button */}
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

export default function ReflectionHistoryScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [reflections, setReflections] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const headerOpacity = useRef(new Animated.Value(0)).current;

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
      {/* Dark navy gradient */}
      <LinearGradient
        colors={['#07111E', '#0C1A2E', '#0F1F30']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Ambient glow orb */}
      <View style={styles.glowOrb} pointerEvents="none" />

      {/* Twinkling stars */}
      {STARS.map((star, i) => <TwinklingStar key={i} {...star} />)}

      {/* Mandala backdrop */}
      <View style={styles.mandalaWrap} pointerEvents="none">
        <AnimatedMandala size={270} color={Colors.accent.primary} opacity={0.055} />
      </View>

      {/* Header */}
      <Animated.View style={[styles.header, { paddingTop: insets.top + 16, opacity: headerOpacity }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerPretitle}>BETWEEN YOU AND ALLAH</Text>
            <Text style={styles.headerTitle}>REFLECTIONS</Text>
          </View>
          {/* Lock icon */}
          <View style={styles.headerLockCircle}>
            <MaterialCommunityIcons name="lock" size={18} color={Colors.accent.primary} />
          </View>
        </View>

        {/* Privacy badge */}
        <BlurView intensity={10} tint="dark" style={styles.privacyBadge}>
          <MaterialCommunityIcons name="lock" size={11} color="rgba(201,168,76,0.7)" />
          <Text style={styles.privacyText}>Encrypted · Local only · Never shared</Text>
        </BlurView>
      </Animated.View>

      {/* Reflection list */}
      <ScrollView
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Write new CTA card (purple gradient per target) */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => setShowModal(true)}>
          <BlurView intensity={12} tint="dark" style={styles.writeCard}>
            <LinearGradient
              colors={['rgba(167,139,250,0.16)', 'rgba(139,92,246,0.06)']}
              style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.writeCardInner}>
              <View style={styles.writeIconCircle}>
                <MaterialCommunityIcons name="pen-plus" size={22} color="#C4B5FD" />
              </View>
              <View style={styles.writeCardText}>
                <Text style={styles.writeCardTitle}>WRITE A NEW REFLECTION</Text>
                <Text style={styles.writeCardSub}>A private space, just for you</Text>
              </View>
              <MaterialCommunityIcons name="feather" size={18} color="rgba(196,181,253,0.6)" />
            </View>
          </BlurView>
        </TouchableOpacity>

        {/* Reflection cards */}
        {reflections.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="notebook-heart-outline" size={52} color="rgba(201,168,76,0.25)" />
            <Text style={styles.emptyTitle}>Your journal is empty</Text>
            <Text style={styles.emptySub}>
              Every reflection is a step closer to Allah.{'\n'}Start writing today.
            </Text>
          </View>
        ) : (
          reflections.map((r, i) => (
            <ReflectionCard key={r.id || i} reflection={r} index={i} />
          ))
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
  container: { flex: 1, backgroundColor: '#07111E' },

  glowOrb: {
    position: 'absolute',
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(201,168,76,0.05)',
    left: width / 2 - 120, top: 20,
  },
  mandalaWrap: {
    position: 'absolute',
    left: width / 2 - 135, top: 15, zIndex: 0,
  },

  header: { paddingHorizontal: 22, paddingBottom: 14, zIndex: 2 },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 14,
  },
  headerPretitle: {
    fontSize: 10, color: 'rgba(201,168,76,0.6)',
    letterSpacing: 2.5, marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  headerTitle: {
    fontSize: 28, color: '#F0E6D3',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '700', letterSpacing: 1.2,
    textShadowColor: 'rgba(201,168,76,0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerLockCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  privacyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 10, overflow: 'hidden',
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.12)',
    alignSelf: 'flex-start',
  },
  privacyText: {
    fontSize: 11, color: 'rgba(201,168,76,0.6)',
    letterSpacing: 0.5,
  },

  listContent: { paddingHorizontal: 18, paddingTop: 8, gap: 12 },

  // Write card (purple per target)
  writeCard: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(167,139,250,0.25)',
    marginBottom: 2,
  },
  writeCardInner: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 14,
  },
  writeIconCircle: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(167,139,250,0.14)',
    borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  writeCardText: { flex: 1 },
  writeCardTitle: {
    fontSize: 12,
    color: '#DDD0FF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  writeCardSub: {
    fontSize: 12, color: 'rgba(196,181,253,0.55)', marginTop: 3,
  },

  // Reflection cards
  reflectionCard: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
  },
  cardAccentBar: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 8,
  },
  cardHeaderLeft: { flex: 1, marginRight: 8 },
  cardTitle: {
    fontSize: 16, color: '#F0E6D3',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '600', marginBottom: 2,
  },
  cardDate: { fontSize: 11, color: 'rgba(176,196,215,0.4)' },
  moodBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1,
  },
  moodBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  cardPreview: {
    fontSize: 13, color: 'rgba(176,196,215,0.65)',
    lineHeight: 20, marginBottom: 10,
  },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verseRef: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  verseRefText: {
    fontSize: 11, color: 'rgba(201,168,76,0.55)',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  // Empty state
  emptyState: {
    alignItems: 'center', paddingTop: 60, gap: 12,
  },
  emptyTitle: {
    fontSize: 19, color: 'rgba(240,230,211,0.6)',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '600',
  },
  emptySub: {
    fontSize: 14, color: 'rgba(176,196,215,0.4)',
    textAlign: 'center', lineHeight: 22,
  },

  // Bottom sheet
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0C1A2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
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
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 14,
    color: '#F0E6D3',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  sheetClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSectionLabel: {
    fontSize: 10,
    color: 'rgba(176,196,215,0.55)',
    letterSpacing: 1.8,
    fontWeight: '700',
    marginBottom: 10,
  },
  moodChipsRow: {
    gap: 8,
    paddingRight: 4,
    marginBottom: 20,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  moodChipLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  sheetTitleInput: {
    fontSize: 14,
    color: '#F0E6D3',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '700',
    letterSpacing: 1.2,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  sheetBodyInput: {
    minHeight: 140,
    fontSize: 15,
    color: 'rgba(240,230,211,0.9)',
    lineHeight: 22,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    marginBottom: 16,
  },
  sheetSaveBtn: {
    backgroundColor: '#A78BFA',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  sheetSaveText: {
    fontSize: 13,
    color: '#1A0F2E',
    fontWeight: '700',
    letterSpacing: 1.4,
  },
});