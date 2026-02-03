import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FreemiumService } from '../services/freemiumService';
import { useState, useEffect } from 'react';

const { width } = Dimensions.get('window');

interface SavedItemProps {
  title: string;
  source: string;
  date: string;
  mood: string;
  type: 'Quran' | 'Hadith';
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  isSavedLocked?: boolean;
}

const SavedItem = ({
  title,
  source,
  date,
  mood,
  type,
  isFavorite,
  onToggleFavorite,
  isSavedLocked,
}: SavedItemProps) => (
  <TouchableOpacity style={styles.item} activeOpacity={0.7}>
    <View style={styles.itemHeader}>
      <View style={styles.typeBadge}>
        <Text style={styles.typeText}>{type.toUpperCase()}</Text>
      </View>
      <View style={styles.headerRight}>
        <Text style={styles.itemDate}>{date}</Text>
        <TouchableOpacity onPress={onToggleFavorite} style={styles.favoriteButton}>
          <Text style={[styles.favoriteIcon, isFavorite && styles.favoriteActive]}>
            {isFavorite ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
    <Text style={styles.itemTitle} numberOfLines={2}>
      "{title}"
    </Text>
    <View style={styles.itemFooter}>
      <Text style={styles.itemSource}>{source}</Text>
      <View style={styles.moodBadge}>
        <Text style={styles.moodText}>{mood}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const [freemiumService] = useState(() => FreemiumService.getInstance());
  const [isPremium, setIsPremium] = useState(freemiumService.isPremium());

  useEffect(() => {
    setIsPremium(freemiumService.isPremium());
  }, [freemiumService]);

  const handlePremiumFeature = () => {
    if (!isPremium) {
      // This would normally trigger the paywall via a navigation prop
      // For now we'll just log or show an alert if we had access to props
      console.log('Trigger paywall for collections/favorites');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Saved Guidance</Text>
          {!isPremium && (
            <View style={styles.limitBadge}>
              <Text style={styles.limitText}>12/10 SAVED</Text>
            </View>
          )}
        </View>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search your reflections..."
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* COLLECTIONS SECTION */}
        <View style={styles.collectionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>COLLECTIONS</Text>
            {!isPremium && <Text style={styles.premiumLock}>🔒</Text>}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.collectionsScroll}
          >
            <TouchableOpacity
              style={[styles.collectionCard, styles.addCollection]}
              onPress={handlePremiumFeature}
            >
              <Text style={styles.addIcon}>+</Text>
              <Text style={styles.addLabel}>New</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.collectionCard} onPress={handlePremiumFeature}>
              <Text style={styles.collectionIcon}>📁</Text>
              <Text style={styles.collectionName}>Dhikr</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.collectionCard} onPress={handlePremiumFeature}>
              <Text style={styles.collectionIcon}>☪</Text>
              <Text style={styles.collectionName}>Ramadan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.collectionCard} onPress={handlePremiumFeature}>
              <Text style={styles.collectionIcon}>🌿</Text>
              <Text style={styles.collectionName}>Peace</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Total Saved</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>RECENTLY SAVED</Text>
        <SavedItem
          title="Indeed, with hardship comes ease"
          source="Quran 94:6"
          date="2 hours ago"
          mood="Anxious"
          type="Quran"
        />
        <SavedItem
          title="The strongest among you is not the one who can wrestle..."
          source="Bukhari & Muslim"
          date="Yesterday"
          mood="Angry"
          type="Hadith"
        />
        <SavedItem
          title="My mercy encompasses all things"
          source="Quran 7:156"
          date="3 days ago"
          mood="Sad"
          type="Quran"
        />
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 80 }]}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
    paddingBottom: 16,
    backgroundColor: '#11171D',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  limitBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  limitText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF6B6B',
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  collectionsSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  premiumLock: {
    fontSize: 12,
    marginBottom: 14,
  },
  collectionsScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  collectionCard: {
    width: 100,
    height: 100,
    backgroundColor: '#1A232C',
    borderRadius: 20,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  addCollection: {
    borderStyle: 'dashed',
    borderColor: 'rgba(46, 211, 198, 0.4)',
    backgroundColor: 'transparent',
  },
  addIcon: {
    fontSize: 24,
    color: '#2ED3C6',
    marginBottom: 4,
  },
  addLabel: {
    fontSize: 12,
    color: '#2ED3C6',
    fontWeight: '600',
  },
  collectionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  collectionName: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#121A1F',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2ED3C6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2ED3C6',
    letterSpacing: 2,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  item: {
    backgroundColor: '#161F29',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeBadge: {
    backgroundColor: 'rgba(46, 211, 198, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    color: '#2ED3C6',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  itemDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  favoriteButton: {
    padding: 4,
  },
  favoriteIcon: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.2)',
  },
  favoriteActive: {
    color: '#FFD700',
  },
  itemTitle: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: 24,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemSource: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  moodBadge: {
    backgroundColor: 'rgba(46, 211, 198, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(46, 211, 198, 0.15)',
  },
  moodText: {
    color: '#2ED3C6',
    fontSize: 11,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2ED3C6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#2ED3C6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  fabIcon: {
    fontSize: 32,
    color: '#0B0F12',
    fontWeight: '400',
  },
});
