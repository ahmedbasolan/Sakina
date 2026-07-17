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
  Platform,
  Clipboard,
  Image,
  ImageBackground,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Spacing, Typography } from '../theme/DesignSystem';
import { BackgroundTheme } from '../types';
import { BACKGROUND_THEMES } from '../services/backgroundThemeService';
import BackgroundThemePicker from './BackgroundThemePicker';
import { resolveCardBackground, buildShareText, CardTheme } from '../utils/shareCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ShareSheetProps {
  isVisible: boolean;
  onClose: () => void;
  isPremium: boolean;
  onUpgrade: () => void;
  content: {
    text: string;
    source: string;
    translation?: string;
    arabicText?: string;
    transliteration?: string;
  };
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

interface CardContentProps {
  textColor: string;
  subTextColor: string;
  content: ShareSheetProps['content'];
  parsedSource: { name: string; ref: string };
  selectedFont: (typeof FONTS)[number];
  showArabic: boolean;
  showTransliteration: boolean;
  showEnglish: boolean;
}

/** The card's text layer — identical whether it sits over a gradient or a
 *  premium photo background, so both branches in ShareSheet render it.
 *  No numberOfLines/adjustsFontSizeToFit here (CLAUDE.md's Quran-quoting
 *  rules, §4): a clamp with no expand affordance silently ellipsis-clips
 *  the ayah, which is never acceptable. The card only has a minHeight and
 *  sits in a ScrollView, so a long verse (e.g. Ayat al-Kursi) just makes
 *  the preview taller instead of losing text. */
const CardContent = ({
  textColor,
  subTextColor,
  content,
  parsedSource,
  selectedFont,
  showArabic,
  showTransliteration,
  showEnglish,
}: CardContentProps) => (
  <>
    <View style={styles.cardHeader}>
      <Ionicons
        name="moon-outline"
        size={11}
        color={subTextColor}
        style={{ opacity: 0.65, marginRight: 5 }}
      />
      <Text style={[styles.moodLabel, { color: subTextColor }]}>Sakina app</Text>
    </View>

    <View style={styles.quoteContainer}>
      {showArabic && content.arabicText && (
        <Text style={[styles.previewArabic, { color: textColor }]}>{content.arabicText}</Text>
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
        >
          "{content.text}"
        </Text>
      )}
    </View>

    <View style={styles.previewFooter}>
      <Text style={[styles.previewSurahName, { color: textColor }]}>
        {parsedSource.name.toUpperCase()}
      </Text>
      {parsedSource.ref !== '' && (
        <Text style={[styles.previewVerseRef, { color: subTextColor }]}>{parsedSource.ref}</Text>
      )}
    </View>
  </>
);

const ShareSheet = ({ isVisible, onClose, isPremium, onUpgrade, content }: ShareSheetProps) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Personalization State
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>(CARD_THEMES[2]); // Default Purple
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);
  const [selectedPhotoTheme, setSelectedPhotoTheme] = useState<BackgroundTheme | null>(null);
  const [isPhotoPickerVisible, setIsPhotoPickerVisible] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  // A lapsed subscriber never gets stuck rendering a background they can no
  // longer pick — reset the moment isPremium turns false.
  useEffect(() => {
    if (!isPremium) setSelectedPhotoTheme(null);
  }, [isPremium]);

  // Content Filtering State
  const [showArabic, setShowArabic] = useState(!!content.arabicText);
  const [showEnglish, setShowEnglish] = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(!!content.transliteration);

  // Depend on the two primitive fields this effect actually reads, not the
  // whole `content` object — both call sites (SurahReaderScreen,
  // GuidanceScreen) construct `content` as a fresh literal every render, so
  // depending on the object reference re-ran this on every unrelated parent
  // re-render while the sheet was open, silently reverting the user's
  // Arabic/Transliteration toggle choices back to their defaults.
  useEffect(() => {
    setShowArabic(!!content.arabicText);
    setShowTransliteration(!!content.transliteration);
  }, [content.arabicText, content.transliteration]);

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

  /** Captures the preview card (whatever background/content is currently
   *  showing) to a local PNG file. Called lazily at share/save time rather
   *  than on every render so theme/toggle changes don't trigger disk I/O. */
  const captureCardImage = async (): Promise<string> => {
    const uri = await viewShotRef.current?.capture?.();
    if (!uri) throw new Error('Failed to capture share card');
    return uri;
  };

  const handleAction = async (action: string) => {
    const shareText = buildShareText(content, {
      showEnglish,
      showArabic,
      showTransliteration,
    });

    try {
      if (action === 'copy_text') {
        Clipboard.setString(shareText);
        return;
      }

      if (action === 'save_image') {
        const uri = await captureCardImage();
        const permission = await MediaLibrary.requestPermissionsAsync();
        if (permission.granted) {
          await MediaLibrary.saveToLibraryAsync(uri);
        }
        return;
      }

      // Every social target (WhatsApp/Telegram/Messages/Instagram) and the
      // "more" fallback share the captured image the same way: URL schemes
      // like whatsapp:// can only carry text, never a file, so the only way
      // to hand a real image to a specific app is the OS's own share sheet —
      // the user picks the app from there themselves.
      const uri = await captureCardImage();
      if (Platform.OS === 'ios') {
        await Share.share({ url: uri, message: shareText });
      } else {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: shareText });
      }
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
    <TouchableOpacity
      style={styles.socialItem}
      onPress={() => handleAction(name)}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
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
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.actionLabel}>{label}</Text>
      <Ionicons name={icon} size={20} color="rgba(255,255,255,0.4)" />
    </TouchableOpacity>
  );

  const background = resolveCardBackground(selectedTheme, selectedPhotoTheme, isPremium);
  const { textColor, subTextColor } = background;

  const parsedSource = parseSource(content.source);

  return (
    <Modal visible={isVisible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose} accessibilityRole="button" accessibilityLabel="Dismiss share sheet">
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
            {/* PREVIEW CARD — captured verbatim by ViewShot for the real
                share/save image, so whatever renders here (gradient or
                premium photo) is exactly what gets sent.
                The drop shadow lives on this OUTER wrapper, not on the card
                itself: Android can't reliably combine `elevation` with
                `overflow:'hidden'` + `borderRadius` on the same view — the
                clip and the shadow fight, and the shadow's own rounded-rect
                backing shows through past the image's corners. Keeping the
                shadow on a plain, non-clipping wrapper and the corner
                clipping on the inner card (which ViewShot captures alone,
                so the exported image never bakes the shadow in) fixes both
                at once. */}
            <View style={styles.previewCardShadow}>
              <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
                {background.kind === 'photo' ? (
                  <ImageBackground
                    source={background.imageSource}
                    style={styles.previewCard}
                    imageStyle={styles.previewCardImage}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.65)']}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <CardContent
                      textColor={textColor}
                      subTextColor={subTextColor}
                      content={content}
                      parsedSource={parsedSource}
                      selectedFont={selectedFont}
                      showArabic={showArabic}
                      showTransliteration={showTransliteration}
                      showEnglish={showEnglish}
                    />
                  </ImageBackground>
                ) : (
                  <LinearGradient
                    colors={background.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.previewCard}
                  >
                    <CardContent
                      textColor={textColor}
                      subTextColor={subTextColor}
                      content={content}
                      parsedSource={parsedSource}
                      selectedFont={selectedFont}
                      showArabic={showArabic}
                      showTransliteration={showTransliteration}
                      showEnglish={showEnglish}
                    />
                  </LinearGradient>
                )}
              </ViewShot>
            </View>

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
                    accessibilityRole="button"
                    accessibilityLabel="Arabic"
                    accessibilityState={{ selected: showArabic }}
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
                  accessibilityRole="button"
                  accessibilityLabel="English"
                  accessibilityState={{ selected: showEnglish }}
                >
                  <Text style={[styles.filterChipText, showEnglish && styles.filterChipTextActive]}>
                    ENGLISH
                  </Text>
                </TouchableOpacity>
                {content.transliteration && (
                  <TouchableOpacity
                    style={[styles.filterChip, showTransliteration && styles.filterChipActive]}
                    onPress={() => setShowTransliteration(!showTransliteration)}
                    accessibilityRole="button"
                    accessibilityLabel="Phonetic"
                    accessibilityState={{ selected: showTransliteration }}
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
                      selectedTheme.id === theme.id && !selectedPhotoTheme && styles.themeOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedTheme(theme);
                      setSelectedPhotoTheme(null);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={theme.label}
                    accessibilityState={{ selected: selectedTheme.id === theme.id && !selectedPhotoTheme }}
                  >
                    <LinearGradient
                      colors={theme.colors}
                      style={styles.themeCircle}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.themeOption, !!selectedPhotoTheme && styles.themeOptionSelected]}
                  onPress={() => setIsPhotoPickerVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isPremium ? 'Nature photo background' : 'Nature photo background, premium'
                  }
                  accessibilityState={{ selected: !!selectedPhotoTheme }}
                >
                  <View style={styles.photoThemeCircle}>
                    {selectedPhotoTheme ? (
                      <Image source={selectedPhotoTheme.imageSource} style={styles.photoThemeThumb} />
                    ) : (
                      <Ionicons name="image-outline" size={20} color="rgba(255,255,255,0.6)" />
                    )}
                    {!isPremium && (
                      <View style={styles.photoThemeLock}>
                        <Ionicons name="lock-closed" size={9} color="#FFF" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
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
                    accessibilityRole="button"
                    accessibilityLabel={font.name}
                    accessibilityState={{ selected: selectedFont.id === font.id }}
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

        <BackgroundThemePicker
          isVisible={isPhotoPickerVisible}
          onClose={() => setIsPhotoPickerVisible(false)}
          isPremium={isPremium}
          selectedThemeId={selectedPhotoTheme?.id ?? null}
          onSelectTheme={(themeId) => {
            setSelectedPhotoTheme(
              themeId ? BACKGROUND_THEMES.find((t) => t.id === themeId) ?? null : null,
            );
          }}
          onUpgrade={() => {
            setIsPhotoPickerVisible(false);
            onClose();
            onUpgrade();
          }}
        />
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
  // Shadow only — no overflow/borderRadius-vs-elevation conflict here since
  // this view clips nothing. See the comment at the call site.
  previewCardShadow: {
    borderRadius: BorderRadius.xxl,
    marginBottom: Spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  previewCard: {
    width: '100%',
    minHeight: 300,
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewCardImage: {
    borderRadius: BorderRadius.xxl,
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
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewArabic: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Typography.fonts.arabic,
    lineHeight: 46,
    paddingVertical: 8,
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
  photoThemeCircle: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoThemeThumb: {
    width: '100%',
    height: '100%',
  },
  photoThemeLock: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
