import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Mood, UserPathProgress } from '../types';
import { PathsService } from '../services/pathsService';
import { STATIC_SPIRITUAL_PATHS } from '../data/staticPaths';

const { width } = Dimensions.get('window');

interface PathCardProps {
  title: string;
  duration: string;
  description: string;
  icon: string;
  isPremium?: boolean;
  isLocked?: boolean;
  progress?: number;
  onPress: () => void;
}

const PathCard = ({
  title,
  duration,
  description,
  icon,
  isPremium,
  isLocked,
  progress,
  onPress,
}: PathCardProps) => (
  <TouchableOpacity
    style={[styles.card, isLocked && styles.lockedCard]}
    activeOpacity={0.8}
    onPress={onPress}
  >
    <View style={[styles.cardIconContainer, isLocked && styles.lockedIconContainer]}>
      {isLocked ? (
        <MaterialCommunityIcons name="lock" size={24} color="rgba(255, 255, 255, 0.3)" />
      ) : (
        <Text style={styles.cardIcon}>{icon}</Text>
      )}
    </View>
    <View style={styles.cardContent}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, isLocked && styles.lockedText]}>{title}</Text>
        {isPremium && (
          <View style={[styles.premiumBadge, isLocked && styles.lockedBadge]}>
            <Text style={[styles.premiumText, isLocked && styles.lockedBadgeText]}>
              {isLocked ? 'LOCKED' : 'PREMIUM'}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.cardDuration, isLocked && styles.lockedText]}>{duration}</Text>
      <Text style={[styles.cardDescription, isLocked && styles.lockedText]} numberOfLines={2}>
        {description}
      </Text>

      {progress !== undefined && !isLocked && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
          <Text style={styles.progressText}>{Math.round(progress)}% complete</Text>
        </View>
      )}
    </View>
    {isLocked && (
      <View style={styles.lockedOverlay}>
        <MaterialCommunityIcons name="crown" size={16} color="#FFD700" style={{ marginRight: 4 }} />
        <Text style={styles.lockedOverlayText}>Premium</Text>
      </View>
    )}
  </TouchableOpacity>
);

interface BundleCardProps {
  title: string;
  description: string;
  priceAED: number;
  isPremiumMember: boolean;
  onPress: () => void;
}

const BundleCard = ({
  title,
  description,
  priceAED,
  isPremiumMember,
  onPress,
}: BundleCardProps) => {
  const finalPrice = isPremiumMember ? (priceAED / 2).toFixed(2) : priceAED.toFixed(2);

  return (
    <TouchableOpacity
      style={[styles.card, styles.bundleCard]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={[styles.cardIconContainer, styles.bundleIconContainer]}>
        <Text style={styles.cardIcon}>🌟</Text>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{title}</Text>
          <View style={styles.specialBadge}>
            <Text style={styles.specialBadgeText}>SPECIAL</Text>
          </View>
        </View>
        <Text style={styles.cardDescription}>{description}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.aedLabel}>AED</Text>
          <Text style={styles.priceValue}>{finalPrice}</Text>
          {isPremiumMember && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-50% FOR YOU</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface PathsScreenProps {
  onPathSelected: (pathId: string) => void;
  userProgress?: UserPathProgress;
  isPremium?: boolean;
  unlockedBundleIds?: string[];
}

export default function PathsScreen({
  onPathSelected,
  userProgress,
  isPremium = false,
  unlockedBundleIds = [],
}: PathsScreenProps) {
  const [activeCategory, setActiveCategory] = useState<'journeys' | 'collections'>('journeys');
  const insets = useSafeAreaInsets();
  const pathsService = PathsService.getInstance();
  const allPaths = pathsService.getAllPaths(isPremium, unlockedBundleIds);
  const availableBundles = pathsService
    .getAvailableBundles()
    .filter((b) => !unlockedBundleIds.includes(b.id));

  const getPathProgress = (pathId: string) => {
    if (userProgress && userProgress.pathId === pathId) {
      return pathsService.getProgressPercentage(userProgress);
    }
    return undefined;
  };

  const activePath = userProgress ? allPaths.find((p) => p.id === userProgress.pathId) : null;
  const explorPaths = allPaths.filter((p) => !userProgress || p.id !== userProgress.pathId);

  const getPathIcon = (theme: Mood) => {
    switch (theme) {
      case 'Anxious':
        return '🌱';
      case 'Calm':
        return '🕊️';
      case 'Sad':
        return '🕊️';
      case 'Content':
        return '✨';
      case 'Angry':
        return '🔥';
      case 'Grateful':
        return '🙏';
      case 'Tired':
        return '🕯️';
      case 'Energized':
        return '⚡';
      case 'Stressed':
        return '🌊';
      case 'Hopeful':
        return '🌙';
      default:
        return '✨';
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={styles.headerTitle}>Guided Journeys</Text>
        <Text style={styles.headerSubtitle}>Curated paths for deep spiritual growth</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeCategory === 'journeys' && styles.activeTab]}
            onPress={() => setActiveCategory('journeys')}
          >
            <Text style={[styles.tabText, activeCategory === 'journeys' && styles.activeTabText]}>
              Journeys
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeCategory === 'collections' && styles.activeTab]}
            onPress={() => setActiveCategory('collections')}
          >
            <Text
              style={[styles.tabText, activeCategory === 'collections' && styles.activeTabText]}
            >
              Special Editions
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeCategory === 'journeys' ? (
          <>
            {activePath && (
              <>
                <Text style={styles.sectionTitle}>CURRENTLY ACTIVE</Text>
                <PathCard
                  key={activePath.id}
                  title={activePath.title}
                  duration={`${activePath.duration}-Day Journey`}
                  description={activePath.description}
                  icon={getPathIcon(activePath.theme)}
                  progress={getPathProgress(activePath.id)}
                  onPress={() => onPathSelected(activePath.id)}
                />
              </>
            )}

            <Text style={styles.sectionTitle}>EXPLORE PATHS</Text>
            {explorPaths.map((path) => (
              <PathCard
                key={path.id}
                title={path.title}
                duration={`${path.duration}-Day Journey`}
                description={path.description}
                icon={getPathIcon(path.theme)}
                isPremium={path.isPremium}
                isLocked={path.isPremium && !isPremium}
                onPress={() => onPathSelected(path.id)}
              />
            ))}
          </>
        ) : (
          <>
            {availableBundles.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, styles.specialSectionTitle]}>
                  SPECIAL COLLECTIONS
                </Text>
                {availableBundles.map((bundle) => (
                  <BundleCard
                    key={bundle.id}
                    title={bundle.name}
                    description={bundle.description}
                    priceAED={bundle.priceAED}
                    isPremiumMember={isPremium}
                    onPress={() => {
                      const path = STATIC_SPIRITUAL_PATHS.find((p) => p.bundleId === bundle.id);
                      if (path) onPathSelected(path.id);
                    }}
                  />
                ))}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  You've unlocked all current special editions! ✨
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F12',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#11171D',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
    marginTop: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#1C262F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  activeTabText: {
    color: '#2ED3C6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2ED3C6',
    letterSpacing: 1.5,
    marginBottom: 16,
    marginTop: 8,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1A232C',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(46, 211, 198, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  premiumBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  premiumText: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: '700',
  },
  cardDuration: {
    fontSize: 12,
    color: '#2ED3C6',
    fontWeight: '500',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2ED3C6',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '500',
  },
  bundleCard: {
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1.5,
  },
  bundleIconContainer: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  specialBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  specialBadgeText: {
    color: '#D4AF37',
    fontSize: 9,
    fontWeight: '700',
  },
  specialSectionTitle: {
    color: '#D4AF37',
    marginTop: 24,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
  },
  aedLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginRight: 4,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  discountBadge: {
    backgroundColor: 'rgba(46, 211, 198, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 10,
  },
  discountText: {
    color: '#2ED3C6',
    fontSize: 10,
    fontWeight: '800',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyStateText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    textAlign: 'center',
  },
  lockedCard: {
    opacity: 0.6,
  },
  lockedIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  lockedText: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  lockedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  lockedBadgeText: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lockedOverlayText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
