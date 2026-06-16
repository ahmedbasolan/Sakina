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
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Spacing, Typography } from '../theme/DesignSystem';

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

/** Parse "Surah Ar-Rum 30:4-5" → { name: "Ar-Rum", ref: "30:4-5" } */
function parseSource(src: string): { name: string; ref: string } {
  const match = src.match(/^Surah\s+(.+?)\s+(\d+:\d+(?:-\d+)?)$/);
  if (match) return { name: match[1], ref: match[2] };
  return { name: src, ref: '' };
}

const ShareSheet = ({ isVisible, onClose, content }: ShareSheetProps) => {
  const insets = useSafeAreaInsets();
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
    if (showTransliteration && content.transliteration)
      shareText += `(${content.transliteration})\n`;
    shareText += `\n${content.source}\n\nShared via Quiet Heart`;

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
      } else if (action === 'instagram') {
        // Instagram doesn't support pre-filled text — open the app and let the user paste
        const url = 'instagram://app';
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          Clipboard.setString(shareText);
          return Linking.openURL(url);
        }
      } else if (action === 'copy_text') {
        Clipboard.setString(shareText);
        onClose();
        return;
      }

      // Fallback: system share sheet
      await Share.share({ message: shareText });
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

  const parsedSource = parseSource(content.source);

  // Cap English lines based on how many other content types are visible —
  // prevents overflow when long verses + Arabic + transliteration are all on.
  const englishMaxLines =
    showArabic && showTransliteration ? 4
    : showArabic ? 5
    : 7;

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
              },
            ]}
          />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.sheetContainer, { transform: [{ translateY: slideAnim }] }]}>
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
              {/* ── Card top: app branding ── */}
              <View style={styles.cardHeader}>
                <Ionicons name="moon-outline" size={11} color={subTextColor} style={{ opacity: 0.65, marginRight: 5 }} />
                <Text style={[styles.moodLabel, { color: subTextColor }]}>Sakina app</Text>
              </View>

              {/* ── Verse content ── */}
              <View style={styles.quoteContainer}>
                {showArabic && content.arabicText && (
                  <Text
                    style={[styles.previewArabic, { color: textColor }]}
                    numberOfLines={showEnglish ? 4 : 6}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.65}
                  >
                    {content.arabicText}
                  </Text>
                )}
                {showTransliteration && content.transliteration && (
                  <Text
                    style={[styles.previewTransliteration, { color: subTextColor }]}
                    numberOfLines={2}
                  >
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
                    numberOfLines={englishMaxLines}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.65}
                  >
                    "{content.text}"
                  </Text>
                )}
              </View>

              {/* ── Card bottom: surah name + verse ref ── */}
              <View style={styles.previewFooter}>
                <Text style={[styles.previewSurahName, { color: textColor }]}>
                  {parsedSource.name.toUpperCase()}
                </Text>
                {parsedSource.ref !== '' && (
                  <Text style={[styles.previewVerseRef, { color: subTextColor }]}>
                    {parsedSource.ref}
                  </Text>
                )}
              </View>
            </LinearGradient>

            {/* PERSONALIZE - COLORS */}
            <View style={styles.personalizeSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Show</Text>
                <Ionicons name="options-outline" size={16} color={Colors.accent.primary} />
              </View>

              <View style={styles.filterContainer}>
                {content.arabicText && (
                  <TouchableOpacity
                    style={[styles.filterChip, showArabic && styles.filterChipActive]}
                    onPress={() => setShowArabic(!showArabic)}
                  >
                    <Text
                      style={[styles.filterChipText, showArabic && styles.filterChipTextActive]}
                    >
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
                    <Text
                      style={[
                        styles.filterChipText,
                        showTransliteration && styles.filterChipTextActive,
                      ]}
                    >
                      PHONETIC
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>Style</Text>
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
                <SocialTarget name="messages" icon="chatbubble" color="#007AFF" label="Messages" />
                <SocialTarget
                  name="whatsapp"
                  icon="logo-whatsapp"
                  color="#25D366"
                  label="WhatsApp"
                />
                <SocialTarget
                  name="telegram"
                  icon="send"
                  color="#2AABEE"
                  label="Telegram"
                />
                <SocialTarget
                  name="instagram"
                  icon="camera"
                  color="#E1306C"
                  label="Instagram"
                />
                <SocialTarget name="more" icon="ellipsis-horizontal" color="#3A3A3C" label="More" />
              </ScrollView>
            </View>

            {/* ACTION LIST */}
            <View style={styles.actionSection}>
              <ActionRow
                label="Copy Text"
                icon="copy-outline"
                onPress={() => handleAction('copy_text')}
              />
              <ActionRow
                label="Save Image"
                icon="download-outline"
                onPress={() => handleAction('save_image')}
                isLast
              />
            </View>

            {/* Home indicator clearance */}
            <View style={{ height: insets.bottom + Spacing.xl }} />
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
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
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
    aspectRatio: 1.05,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    opacity: 0.65,
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
    fontFamily: Typography.fonts.arabic,
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
    marginTop: 8,
    gap: 3,
  },
  previewSurahName: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2.5,
    opacity: 0.9,
  },
  previewVerseRef: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.5,
    opacity: 0.65,
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
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
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
    borderColor: Colors.accent.primary,
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
    borderColor: Colors.accent.primary,
    backgroundColor: Colors.accent.muted,
  },
  fontChipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  fontChipTextSelected: {
    color: Colors.accent.primary,
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
    backgroundColor: Colors.accent.muted,
    borderColor: Colors.accent.primary,
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
  filterChipTextActive: {
    color: Colors.accent.primary,
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
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
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
