import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Share,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Grid, Colors } from '../theme/DesignSystem';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface ShareSheetProps {
  isVisible: boolean;
  onClose: () => void;
  content: {
    text: string;
    source: string;
    translation?: string;
    arabicText?: string;
    transliteration?: string;
  };
}

interface CardTheme {
  id: string;
  colors: [string, string, ...string[]];
  label: string;
  textColor?: string;
}

const CARD_THEMES: CardTheme[] = [
  { id: 'orange', colors: ['#D97706', '#B45309'], label: 'Amber' },
  { id: 'white', colors: ['#FFFFFF', '#F3F4F6'], label: 'Pearl', textColor: '#1F2937' },
  { id: 'purple', colors: ['#C4B5FD', '#8B5CF6'], label: 'Royal' },
  { id: 'teal', colors: ['#2DD4BF', '#0F766E'], label: 'Ocean' },
  { id: 'dark', colors: ['#374151', '#111827'], label: 'Night' },
  { id: 'blue', colors: ['#60A5FA', '#2563EB'], label: 'Sky' },
];

const FONTS = [
  { id: 'serif', name: 'Playfair Display', family: Platform.OS === 'ios' ? 'Didot' : 'serif' },
  {
    id: 'slab',
    name: 'Noto Serif',
    family: Platform.OS === 'ios' ? 'American Typewriter' : 'monospace',
  },
  { id: 'sans', name: 'Outfit Sans', family: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif' },
];

const ShareSheet = ({ isVisible, onClose, content }: ShareSheetProps) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Personalization State
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>(CARD_THEMES[2]); // Default Purple
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);

  // Content Filtering State
  const [showArabic, setShowArabic] = useState(!!content.arabicText);
  const [showEnglish, setShowEnglish] = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(!!content.transliteration);

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const handleAction = async (action: string) => {
    let shareText = '';
    if (showEnglish) shareText += `"${content.text}"\n\n`;
    if (showArabic && content.arabicText) shareText += `${content.arabicText}\n`;
    if (showTransliteration && content.transliteration) shareText += `(${content.transliteration})\n`;
    shareText += `\n${content.source}\n\nShared via SAKINA App`;

    try {
      if (action === 'whatsapp') {
        const url = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) return Linking.openURL(url);
      } else if (action === 'telegram') {
        const url = `tg://msg?text=${encodeURIComponent(shareText)}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) return Linking.openURL(url);
      } else if (action === 'messages') {
        const url = `sms:&body=${encodeURIComponent(shareText)}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) return Linking.openURL(url);
      }

      // Fallback
      await Share.share({
        message: shareText,
      });
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      onClose();
    }
  };

  const SocialTarget = ({
    name,
    icon,
    color,
    label,
  }: {
    name: string;
    icon: any;
    color: string;
    label: string;
  }) => (
    <TouchableOpacity style={styles.socialItem} onPress={() => handleAction(name)}>
      <View style={[styles.socialCircle, { backgroundColor: color }]}>
        <Ionicons name={icon} size={28} color="#FFF" />
      </View>
      <Text style={styles.socialLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const ActionRow = ({
    label,
    icon,
    onPress,
    isLast,
  }: {
    label: string;
    icon: any;
    onPress: () => void;
    isLast?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.actionRow, !isLast && styles.actionRowBorder]}
      onPress={onPress}
    >
      <Text style={styles.actionLabel}>{label}</Text>
      <Ionicons name={icon} size={20} color="rgba(255,255,255,0.4)" />
    </TouchableOpacity>
  );

  const textColor = selectedTheme.textColor || '#FFFFFF';
  const subTextColor = selectedTheme.textColor
    ? 'rgba(31, 41, 55, 0.7)'
    : 'rgba(255, 255, 255, 0.8)';

  return (
    <Modal visible={isVisible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: fadeAnim,
                backgroundColor: 'rgba(0,0,0,0.85)',
              }
            ]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* HANDLEBAR */}
          <View style={styles.handleBar} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={true}
          >
            {/* PREVIEW CARD */}
            <LinearGradient
              colors={selectedTheme.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.previewCard}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.moodLabel, { color: subTextColor }]}>
                  SPIRITUAL GUIDANCE
                </Text>
              </View>

              <View style={styles.cardDecoration}>
                <Text style={[styles.sparkleIcon, { color: subTextColor }]}>✦</Text>
              </View>

              <View style={styles.quoteContainer}>
                {showArabic && content.arabicText && (
                  <Text
                    style={[styles.previewArabic, { color: textColor }]}
                    numberOfLines={3}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.6}
                  >
                    {content.arabicText}
                  </Text>
                )}
                {showTransliteration && content.transliteration && (
                  <Text style={[styles.previewTransliteration, { color: subTextColor }]}>
                    {content.transliteration}
                  </Text>
                )}
                {showEnglish && (
                  <Text
                    style={[
                      styles.previewQuote,
                      {
                        color: textColor,
                        fontFamily: selectedFont.family,
                        fontStyle: selectedFont.id === 'serif' ? 'italic' : 'normal',
                      },
                    ]}
                    numberOfLines={0}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.5}
                  >
                    "{content.text}"
                  </Text>
                )}
              </View>

              <View style={styles.previewFooter}>
                <Text style={[styles.previewSource, { color: subTextColor }]}>
                  {content.source.toUpperCase()}
                </Text>
                <View style={styles.sakinaLogoContainer}>
                  <Ionicons
                    name="book-outline"
                    size={12}
                    color={subTextColor}
                    style={{ opacity: 0.7 }}
                  />
                  <Text style={[styles.brandName, { color: subTextColor }]}>SAKINA</Text>
                </View>
              </View>
            </LinearGradient>

            {/* PERSONALIZE - COLORS */}
            <View style={styles.personalizeSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>CONTENT REFINEMENT</Text>
                <Ionicons name="options-outline" size={16} color={Colors.teal} />
              </View>

              <View style={styles.filterContainer}>
                {content.arabicText && (
                  <TouchableOpacity
                    style={[styles.filterChip, showArabic && styles.filterChipActive]}
                    onPress={() => setShowArabic(!showArabic)}
                  >
                    <Text style={[styles.filterChipText, showArabic && styles.filterChipTextActive]}>
                      ARABIC
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.filterChip, showEnglish && styles.filterChipActive]}
                  onPress={() => setShowEnglish(!showEnglish)}
                >
                  <Text style={[styles.filterChipText, showEnglish && styles.filterChipTextActive]}>
                    ENGLISH
                  </Text>
                </TouchableOpacity>
                {content.transliteration && (
                  <TouchableOpacity
                    style={[styles.filterChip, showTransliteration && styles.filterChipActive]}
                    onPress={() => setShowTransliteration(!showTransliteration)}
                  >
                    <Text style={[styles.filterChipText, showTransliteration && styles.filterChipTextActive]}>
                      PHONETIC
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>STYLE & THEME</Text>
                <Ionicons name="color-palette-outline" size={16} color="rgba(255,255,255,0.5)" />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.themeSelector}
              >
                {CARD_THEMES.map((theme) => (
                  <TouchableOpacity
                    key={theme.id}
                    style={[
                      styles.themeOption,
                      selectedTheme.id === theme.id && styles.themeOptionSelected,
                    ]}
                    onPress={() => setSelectedTheme(theme)}
                  >
                    <LinearGradient
                      colors={theme.colors}
                      style={styles.themeCircle}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* PERSONALIZE - FONTS */}
              <View style={styles.fontSelector}>
                {FONTS.map((font) => (
                  <TouchableOpacity
                    key={font.id}
                    style={[
                      styles.fontChip,
                      selectedFont.id === font.id && styles.fontChipSelected,
                    ]}
                    onPress={() => setSelectedFont(font)}
                  >
                    <Text
                      style={[
                        styles.fontChipText,
                        selectedFont.id === font.id && styles.fontChipTextSelected,
                        { fontFamily: font.family },
                      ]}
                    >
                      {font.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* SOCIAL ROW */}
            <View style={styles.socialRowContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.socialScrollContent}
              >
                <SocialTarget
                  name="messages"
                  icon="chatbubble"
                  color="#007AFF"
                  label="Messages"
                />
                <SocialTarget
                  name="whatsapp"
                  icon="logo-whatsapp"
                  color="#25D366"
                  label="WhatsApp"
                />
                <SocialTarget
                  name="telegram"
                  icon="paper-plane"
                  color="#5EAADE"
                  label="Telegram"
                />
                <SocialTarget
                  name="more"
                  icon="ellipsis-horizontal"
                  color="#1A1A1A"
                  label="More"
                />
              </ScrollView>
            </View>

            {/* ACTION LIST */}
            <View style={styles.actionSection}>
              <ActionRow
                label="Copy Link"
                icon="link-outline"
                onPress={() => handleAction('copy_link')}
              />
              <ActionRow
                label="Save Image"
                icon="download-outline"
                onPress={() => handleAction('save_image')}
                isLast
              />
            </View>

            {/* ADDS EXTRA SPACE FOR HOME INDICATOR */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent', // Handled by Animated.View for fade effect
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#111111', // Very dark grey/black
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    maxHeight: SCREEN_HEIGHT * 0.92,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  previewCard: {
    width: '100%',
    aspectRatio: 0.8,
    borderRadius: 24,
    padding: 24,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  cardHeader: {
    width: '100%',
    alignItems: 'center',
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  cardDecoration: {
    marginBottom: 8,
  },
  sparkleIcon: {
    fontSize: 24,
    opacity: 0.8,
  },
  quoteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  previewArabic: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Amiri-Regular' : 'serif',
    lineHeight: 32,
  },
  previewTransliteration: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 12,
    paddingHorizontal: 12,
    opacity: 0.6,
  },
  previewQuote: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    marginHorizontal: 12,
  },
  previewFooter: {
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
  },
  previewSource: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
    opacity: 0.8,
  },
  sakinaLogoContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  brandName: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 2,
  },
  // Personalize Section
  personalizeSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  themeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  themeOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    padding: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionSelected: {
    borderColor: '#2ED3C6',
  },
  themeCircle: {
    flex: 1,
    borderRadius: 22,
  },
  fontSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  fontChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  fontChipSelected: {
    borderColor: '#2ED3C6',
    backgroundColor: 'rgba(46, 211, 198, 0.1)',
  },
  fontChipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  fontChipTextSelected: {
    color: '#2ED3C6',
    fontWeight: '600',
  },
  // Filters
  filterContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(46, 211, 198, 0.1)',
    borderColor: 'rgba(46, 211, 198, 0.4)',
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
  filterChipTextActive: {
    color: '#2ED3C6',
  },
  // Social
  socialRowContainer: {
    marginBottom: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialScrollContent: {
    paddingHorizontal: 12,
  },
  socialItem: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  socialCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  socialLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  // Actions
  actionSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  actionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  actionLabel: {
    fontSize: 16,
    color: '#E5E5E5',
    fontWeight: '500',
  },
});

export default ShareSheet;
