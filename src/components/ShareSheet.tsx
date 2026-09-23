import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Share,
  Platform,
  Clipboard,
  Image,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Spacing, Typography } from '../theme/DesignSystem';
import { SakinaLantern } from './SakinaLantern';
import { loadLockscreenPrefs, saveLockscreenPrefs } from '../services/lockscreenVerseService';
import { topUpScheduledNotifications } from '../services/notificationTopUpTask';
import { BackgroundTheme } from '../types';
import { BACKGROUND_THEMES } from '../services/backgroundThemeService';
import BackgroundThemePicker from './BackgroundThemePicker';
import {
  resolveCardBackground,
  buildShareText,
  pickShareCardTextTier,
  CardTheme,
  ShareCardTextTier,
} from '../utils/shareCard';

// previewCard's target shape — see the sizing comment at its computation
// below in ShareSheet for why this is a target rather than a hard cap.
// Closer to an actual phone screenshot (~9:16-9:20) than a square-ish social
// post crop (4:5) — the whole point is "looks like a screenshot of the verse
// screen", and the extra height also buys real room for text before tiering
// has to shrink it.
const CARD_ASPECT_RATIO = 0.62; // width / height, portrait
// Header ("Sakina app") + footer (surah name + ref) + inter-block gaps —
// short, roughly-constant-length strings that don't scale with the verse,
// budgeted once here rather than re-measured per render.
const NON_SCALING_CONTENT_HEIGHT = 90;
// Blur for the photo copy that fills the bands around a `contain`ed photo.
// Strong enough that the fill reads as colour, not as a second picture.
const PHOTO_FILL_BLUR_RADIUS = 20;

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
  tier: ShareCardTextTier;
}

/** The card's text layer — identical whether it sits over a gradient or a
 *  premium photo background, so both branches in ShareSheet render it.
 *  No numberOfLines/ellipsis anywhere here (CLAUDE.md's Quran-quoting rules,
 *  §4) — a clamp with no expand affordance silently cuts the ayah, which is
 *  never acceptable regardless of length. Instead the Arabic/transliteration/
 *  English blocks scale down via `tier` (picked in ShareSheet from the
 *  card's fixed target size and the verse's actual length — the *other*
 *  §4-sanctioned option, "font-size scaling, tiered by length", instead of
 *  letting the card grow freely) so a longer verse shrinks its own text
 *  rather than pushing the card — and therefore the photo background —
 *  taller. */
const CardContent = ({
  textColor,
  subTextColor,
  content,
  parsedSource,
  selectedFont,
  showArabic,
  showTransliteration,
  showEnglish,
  tier,
}: CardContentProps) => (
  <>
    <View style={styles.cardHeader}>
      {/* The actual brand mark (the fanoos from the app icon), not a generic
          moon glyph — a shared verse is the one piece of the app most likely
          to be seen by someone who has never opened it, so this mark is doing
          real recognition work. Static: a breathing flame is imperceptible
          at this scale and this image is captured as a still. */}
      <SakinaLantern size={16} animated={false} />
      <Text style={[styles.moodLabel, { color: subTextColor, marginLeft: 4 }]}>Sakina app</Text>
    </View>

    <View style={styles.quoteContainer}>
      {showArabic && content.arabicText && (
        <Text
          style={[
            styles.previewArabic,
            { color: textColor, fontSize: tier.arabicFontSize, lineHeight: tier.arabicLineHeight },
          ]}
        >
          {content.arabicText}
        </Text>
      )}
      {showTransliteration && content.transliteration && (
        <Text
          style={[
            styles.previewTransliteration,
            {
              color: subTextColor,
              fontSize: tier.translitFontSize,
              lineHeight: tier.translitLineHeight,
            },
          ]}
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
              fontSize: tier.quoteFontSize,
              lineHeight: tier.quoteLineHeight,
            },
          ]}
        >
          &quot;{content.text}&quot;
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
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
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

  // Reflects whether the currently selected photo is already the lock screen
  // background, so the checkbox shows real state rather than always starting
  // unchecked.
  const [useOnLockScreen, setUseOnLockScreen] = useState(false);
  useEffect(() => {
    let active = true;
    loadLockscreenPrefs().then((prefs) => {
      if (!active) return;
      setUseOnLockScreen(
        !!selectedPhotoTheme && prefs.enabled && prefs.themeId === selectedPhotoTheme.id,
      );
    });
    return () => {
      active = false;
    };
  }, [selectedPhotoTheme]);

  const handleUseOnLockScreen = useCallback(async () => {
    if (!selectedPhotoTheme) return;
    const next = !useOnLockScreen;
    setUseOnLockScreen(next);
    // Turning it on both selects this theme and enables the feature — a user
    // ticking this box has expressed the whole intent, and leaving them to also
    // find the Settings screen would make the box do nothing visible.
    // Turning it off only clears the theme override; it does not disable lock
    // screen verses, which the user may have set up deliberately elsewhere.
    await saveLockscreenPrefs(
      next ? { enabled: true, themeId: selectedPhotoTheme.id } : { themeId: null },
    );
    topUpScheduledNotifications().catch(() => {
      /* scheduling is best-effort here; the setup screen surfaces failures */
    });
  }, [selectedPhotoTheme, useOnLockScreen]);

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
          toValue: screenHeight,
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
        // `true` = writeOnly. Sakina only ever ADDS a card to the library; it
        // never reads the user's photos. Asking for full access would make
        // Android grant (and Play demand a declaration for) READ_MEDIA_IMAGES
        // and friends, which is a broader claim than the app can justify —
        // see the matching `granularPermissions: []` and blockedPermissions
        // in app.json. Keep all three in step: dropping the manifest
        // permissions while still requesting full access here would make this
        // call fail at runtime rather than degrade to write-only.
        const permission = await MediaLibrary.requestPermissionsAsync(true);
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

  // Target size for previewCard — a `minHeight`, not a hard `height`/
  // `aspectRatio`, so the card renders at this exact size for the common
  // case (full photo background always visible, per the "like a screenshot"
  // brief) while still being able to grow for the rare verse whose text
  // doesn't fit even at the smallest tier below. `cardWidth` mirrors
  // previewCard's actual rendered width: screen width minus sheetContainer's
  // own paddingHorizontal (Spacing.xl on each side).
  const cardWidth = screenWidth - Spacing.xl * 2;
  const cardTargetHeight = cardWidth / CARD_ASPECT_RATIO;

  // Conservative (i.e. narrower) than either branch's real available width —
  // the photo branch additionally insets by glassPanel's own horizontal
  // padding, so using that narrower figure for both branches only ever
  // causes the gradient branch to pick an equal-or-smaller tier than it
  // strictly needs, never a larger one that could overflow.
  const textWidth = cardWidth - Spacing.xl * 2 - Spacing.lg * 2 - Spacing.md;
  const heightBudget = cardTargetHeight - Spacing.xxl * 2 - Spacing.xl * 2 - NON_SCALING_CONTENT_HEIGHT;

  const tier = useMemo(
    () =>
      pickShareCardTextTier(
        {
          arabicText: showArabic ? content.arabicText : undefined,
          transliteration: showTransliteration ? content.transliteration : undefined,
          englishText: showEnglish ? content.text : undefined,
        },
        textWidth,
        heightBudget,
      ),
    [showArabic, showTransliteration, showEnglish, content.arabicText, content.transliteration, content.text, textWidth, heightBudget],
  );

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
                  // Plain View + absolutely-positioned Image instead of
                  // ImageBackground: previewCard's height is set explicitly
                  // below (a computed `minHeight`, not the stylesheet's own
                  // fixed value), and ImageBackground's own implementation
                  // re-proxies width/height from the outer style onto its
                  // inner <Image> (see its "Temporary Workaround" comment in
                  // react-native/Libraries/Image/ImageBackground.js) — with
                  // no resolved height to proxy, the image fell back to its
                  // own intrinsic aspect ratio instead of covering the card,
                  // leaving bare strips at the sides. A directly
                  // absoluteFill'd Image has no such proxy step and reliably
                  // covers the card's real box.
                  //
                  // Two layers of the same photo: a blurred `cover` copy
                  // filling the card, and the sharp photo on top with
                  // `contain`. 23 of the 29 theme photos are landscape
                  // (~3:2) while this card is portrait (0.62), so `cover`
                  // alone cut ~59% of their width, and users saw only a
                  // sliver of the photo they picked. `contain` keeps the
                  // whole photo; the blurred copy fills the bands above and
                  // below it so the card still reads full-bleed rather than
                  // letterboxed. Portrait photos (2:3 and taller) leave only
                  // thin bands, so they still look almost edge to edge.
                  <View
                    style={[styles.previewCard, styles.previewCardPhoto, { minHeight: cardTargetHeight }]}
                  >
                    <Image
                      source={background.imageSource}
                      style={StyleSheet.absoluteFillObject}
                      resizeMode="cover"
                      blurRadius={PHOTO_FILL_BLUR_RADIUS}
                    />
                    <View style={styles.photoFillScrim} />
                    <Image
                      source={background.imageSource}
                      style={StyleSheet.absoluteFillObject}
                      resizeMode="contain"
                    />
                    {/* Even, light scrim instead of the old 15%→85% gradient,
                        which blacked out the bottom of the photo. */}
                    <View style={styles.photoScrim} />
                    <View style={styles.glassPanel}>
                      <CardContent
                        textColor={textColor}
                        subTextColor={subTextColor}
                        content={content}
                        parsedSource={parsedSource}
                        selectedFont={selectedFont}
                        showArabic={showArabic}
                        showTransliteration={showTransliteration}
                        showEnglish={showEnglish}
                        tier={tier}
                      />
                    </View>
                  </View>
                ) : (
                  <LinearGradient
                    colors={background.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.previewCard, { minHeight: cardTargetHeight }]}
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
                      tier={tier}
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

              {/* Carries the photo the user just picked straight over to lock
                  screen verses, so choosing a background twice is unnecessary.
                  Only offered once a photo theme is actually selected — there
                  is nothing to carry over otherwise. */}
              {isPremium && selectedPhotoTheme && (
                <TouchableOpacity
                  style={styles.lockscreenRow}
                  onPress={handleUseOnLockScreen}
                  accessibilityRole="switch"
                  accessibilityLabel="Also use on lock screen"
                  accessibilityState={{ checked: useOnLockScreen }}
                >
                  <Ionicons
                    name={useOnLockScreen ? 'checkbox-outline' : 'square-outline'}
                    size={18}
                    color={useOnLockScreen ? Colors.accent.primary : Colors.text.secondary}
                  />
                  <Text style={styles.lockscreenLabel}>Also use on Lock Screen</Text>
                </TouchableOpacity>
              )}

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
    maxHeight: '92%',
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
    // minHeight is set inline per-render (a computed target from the card's
    // 4:5 aspect ratio) — not fixed here, since it depends on screen width.
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Photo backgrounds hold a single content panel instead of spreading
  // header/quote/footer across the full card height — centering it here
  // (rather than the gradient branch's space-between) is what leaves photo
  // visible above and below the panel instead of the panel's own edges
  // touching the card's edges.
  previewCardPhoto: {
    justifyContent: 'center',
  },
  // Dims the blurred fill so the sharp, uncropped photo on top of it stands
  // out as the actual picture.
  photoFillScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,17,30,0.35)',
  },
  photoScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,17,30,0.25)',
  },
  // Text's own backing over a photo, in NotifCard's navy
  // (LockscreenVersesScreen.tsx) rather than the warm-tinted Colors.glass
  // tokens, which are tuned for this app's dark screens. 0.6 rather than
  // NotifCard's 0.72 so the whole photo, which now sits behind the verse,
  // stays visible through the panel. Worst case (a pure-white photo) under
  // photoScrim still gives primary text about 6:1 contrast.
  glassPanel: {
    width: '100%',
    backgroundColor: 'rgba(12,26,46,0.6)',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
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
  lockscreenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  lockscreenLabel: {
    marginLeft: Spacing.sm,
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.small,
    color: Colors.text.secondary,
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
