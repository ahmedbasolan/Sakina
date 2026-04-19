/**
 * PathsScreen — Sacred Journeys
 *
 * Full dark-theme redesign matching the reference image:
 * Deep navy background (#07111E → #0C1A2E), twinkling stars,
 * mandala backdrop, stats bar, and elegant dark journey cards.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Colors } from '../theme/DesignSystem';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Path, Circle } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UserPathProgress } from '../types';
import { PathsService } from '../services/pathsService';
import { AnimatedMandala } from '../components/AnimatedMandala';

const { width, height } = Dimensions.get('window');



const PATH_VISUALS: Record<string, { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }> = {
  path_salah_transformation: { icon: 'hands-pray', color: '#10B981' },
  path_rizq_revolution: { icon: 'barley', color: '#D4AF37' },
  path_depression_iman: { icon: 'sprout', color: '#818CF8' },
  path_anxiety_tawakkul: { icon: 'feather', color: '#60A5FA' },
  path_marriage_seeker: { icon: 'ring', color: '#F87171' },
  path_guilt_tawbah: { icon: 'heart-plus', color: '#34D399' },
  path_grateful_heart: { icon: 'star-four-points', color: '#FBBF24' },
  path_wrong_marriage: { icon: 'handshake', color: '#A78BFA' },
  path_forced_marriage: { icon: 'shield-alert-outline', color: '#F87171' },
};
const getVisual = (id: string) =>
  PATH_VISUALS[id] || { icon: 'compass-outline' as any, color: Colors.accent.primary };

function JourneyCard({ path, index, isActive, onPress }: { path: any; index: number; isActive: boolean; onPress: () => void }) {
  const visual = getVisual(path.id);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 500, delay: 150 + index * 90, useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0, friction: 8, tension: 80, delay: 150 + index * 90, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Generate fake progress for demo (0–100)
  const progress = path.currentDay && path.duration
    ? Math.round((path.currentDay / path.duration) * 100)
    : 0;
  const totalDays = path.duration || 14;
  const completedDays = path.currentDay || 0;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity activeOpacity={0.88} onPress={onPress}>
        <BlurView intensity={10} tint="dark" style={[styles.journeyCard, isActive && { borderColor: 'rgba(212,175,55,0.4)' }]}>
          <View style={styles.journeyCardInner}>
            {isActive && (
              <View style={{ position: 'absolute', top: -70, right: -70, zIndex: 0, opacity: 0.12 }}>
                <AnimatedMandala size={150} color="#D4AF37" opacity={0.6} />
              </View>
            )}
            
            {/* Top row: icon + info + chevron */}
            <View style={styles.journeyTop}>
              <View style={[styles.journeyIcon, { backgroundColor: `${visual.color}18`, borderColor: `${visual.color}30` }]}>
                <MaterialCommunityIcons name={visual.icon} size={22} color={visual.color} />
              </View>
              <View style={styles.journeyInfo}>
                <View style={styles.pathLabelRow}>
                  <Text style={[styles.journeyPathLabel, { color: visual.color }]}>
                    {totalDays}-DAY PATH
                  </Text>
                  {path.isPremium && (
                    <MaterialCommunityIcons name="lock-outline" size={14} color="#4A6480" style={{ marginLeft: 6 }} />
                  )}
                </View>
                <Text style={[styles.journeyTitle, { color: visual.color }]}>{path.title.toUpperCase()}</Text>
                <Text style={styles.journeyTheme}>{path.target || path.theme}</Text>
              </View>
              <View style={styles.chevronWrap}>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={18}
                  color="#4A6480"
                />
              </View>
            </View>

            {/* Description */}
            <Text style={styles.journeyDescription} numberOfLines={3}>
              {path.description}
            </Text>

            {/* Progress Section: gradient bar + x/y */}
            <View style={styles.progressSection}>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={[visual.color, `${visual.color}CC`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>
              <Text style={[styles.journeyPct, { color: visual.color }]}>
                {completedDays}/{totalDays}
              </Text>
            </View>

            {/* Premium pill (locked paths only) */}
            {path.isPremium && (
              <View style={styles.premiumPill}>
                <MaterialCommunityIcons name="lock-outline" size={12} color="#C9A84C" />
                <Text style={styles.premiumPillText}>Premium · $4.99/month</Text>
                <MaterialCommunityIcons name="star-four-points" size={12} color="#C9A84C" style={{ marginLeft: 'auto' }} />
              </View>
            )}

          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
}

type FilterType = 'all' | 'free' | 'premium';

export default function PathsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [PATHS, setPaths] = useState<any[]>([]);
  const [userProgressList, setUserProgressList] = useState<UserPathProgress[]>([]);
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadPaths = async () => {
      const pathsService = PathsService.getInstance();
      const progress = await pathsService.getAllProgress();
      setUserProgressList(progress);
      const allPaths = pathsService.getAllPaths(true, []);
      setPaths(allPaths);
    };
    loadPaths();
    Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const onPathSelected = (pathId: string) => navigation.navigate('PathDetail', { pathId });

  const stats = [
    { label: 'Paths', value: PATHS.length.toString() },
    { label: 'Active', value: userProgressList.filter(p => !p.isCompleted).length.toString() },
    { label: 'Days left', value: '21' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A1321', '#0C1A2E']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.header, { paddingTop: insets.top + 16, opacity: headerFade }]}>
        <Text style={styles.topBarText}>★ NOOR</Text>
        <Text style={styles.headerPretitle}>GUIDED PROGRAMS</Text>
        <Text style={styles.headerTitle}>SACRED JOURNEYS</Text>
        <Text style={styles.headerSub}>
          14-day curated paths for lasting spiritual transformation.
        </Text>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats bar */}
        <Animated.View style={[styles.statsRow, { opacity: headerFade }]}>
          {stats.map((stat, i) => {
            const colors = ['#D4AF37', '#34D399', '#60A5FA']; // Gold, Teal, Light Blue
            return (
              <BlurView key={stat.label} intensity={12} tint="dark" style={styles.statCard}>
                <Text style={[styles.statValue, { color: colors[i] }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </BlurView>
            );
          })}
        </Animated.View>

        {/* Path cards */}
        <View style={styles.cardsColumn}>
          {PATHS.map((path, index) => {
            const isActive = userProgressList.some(p => p.pathId === path.id && !p.isCompleted);
            return (
              <JourneyCard
                key={path.id}
                path={path}
                index={index}
                isActive={isActive}
                onPress={() => onPathSelected(path.id)}
              />
            );
          })}

          {/* Premium paywall CTA (shown when there are any premium paths) */}
          {PATHS.some((p: any) => p.isPremium) && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('Paywall' as never)}
              style={styles.paywallCTA}
              accessibilityRole="button"
              accessibilityLabel="Unlock premium paths"
            >
              <View style={styles.paywallCTALabelRow}>
                <MaterialCommunityIcons name="star-four-points" size={12} color="#C9A84C" />
                <Text style={styles.paywallCTALabel}>PREMIUM</Text>
              </View>
              <Text style={styles.paywallCTATitle}>
                Unlock All {PATHS.filter((p: any) => p.isPremium).length} Paths
              </Text>
              <Text style={styles.paywallCTASub}>
                Full tafsir · Offline access · Private journal · Smart reminders
              </Text>
              <View style={styles.paywallCTAButton}>
                <Text style={styles.paywallCTAButtonText}>START FREE TRIAL</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C1A2E' },

  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    zIndex: 2,
  },
  topBarText: {
    fontSize: 12,
    color: '#D4AF37', // Gold
    letterSpacing: 2,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  headerPretitle: {
    fontSize: 10,
    color: 'rgba(201,168,76,0.8)',
    letterSpacing: 2.5,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 28,
    color: '#F0E6D3',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '400', // Normal weight for the elegant serif look
    letterSpacing: 0.5,
    marginBottom: 6,
    textShadowColor: 'rgba(201,168,76,0.1)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerSub: {
    fontSize: 13,
    color: '#7B8FA1', // Light grayish blue
  },

  scrollView: { flex: 1, zIndex: 2 },
  content: { paddingHorizontal: 20, paddingTop: 12 },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '400',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  statLabel: {
    fontSize: 11,
    color: '#4A6480',
    letterSpacing: 0.5,
  },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  filterTabActive: {
    backgroundColor: 'rgba(201,168,76,0.18)',
    borderColor: 'rgba(201,168,76,0.35)',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(176,196,215,0.6)',
  },
  filterTextActive: {
    color: Colors.accent.primary,
  },

  cardsColumn: { gap: 12 },

  journeyCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  journeyCardInner: {
    padding: 16,
    backgroundColor: 'rgba(15,25,40,0.6)',
    position: 'relative',
  },
  journeyTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 12,
    zIndex: 1,
  },
  journeyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  journeyInfo: { flex: 1, marginTop: 2, zIndex: 1 },
  pathLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  journeyPathLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '700',
  },
  journeyTitle: {
    fontSize: 19,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '400',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  journeyTheme: {
    fontSize: 12,
    color: '#7B8FA1',
  },
  chevronWrap: {
    marginTop: 4,
  },
  journeyDescription: {
    fontSize: 13,
    color: '#7B8FA1',
    lineHeight: 20,
    marginBottom: 16,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  journeyPct: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    minWidth: 40,
    textAlign: 'right',
  },
  progressTrack: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  /* Premium pill on locked cards */
  premiumPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(201,168,76,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.18)',
  },
  premiumPillText: {
    fontSize: 11,
    color: '#C9A84C',
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  /* Bottom paywall CTA */
  paywallCTA: {
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.35)',
    backgroundColor: 'rgba(201,168,76,0.05)',
    padding: 20,
    overflow: 'hidden',
  },
  paywallCTALabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  paywallCTALabel: {
    fontSize: 10,
    color: '#C9A84C',
    letterSpacing: 2,
    fontWeight: '700',
  },
  paywallCTATitle: {
    fontSize: 20,
    color: '#F0E6D3',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '600',
    marginBottom: 6,
  },
  paywallCTASub: {
    fontSize: 12,
    color: '#8BA4BF',
    marginBottom: 16,
    lineHeight: 18,
  },
  paywallCTAButton: {
    backgroundColor: '#C9A84C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    // subtle glow
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  paywallCTAButtonText: {
    fontSize: 13,
    color: '#0A1321',
    fontWeight: '700',
    letterSpacing: 1.2,
  },
});