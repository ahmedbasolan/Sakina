import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: (plan?: 'free' | 'premium') => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isSpecialPathsExpanded, setIsSpecialPathsExpanded] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const screens = [
    {
      title: 'Spiritual Clarity',
      accent: 'Clarity',
      subtitle: 'Ancient wisdom for modern emotions.',
      icon: '✦',
      features: [
        'Mood-based Quranic guidance',
        'Personalized for your spiritual journey',
        'Authentic reflections and actions',
        'Tailored guidance for every state',
      ],
    },
    {
      title: 'Total Privacy',
      accent: 'Privacy',
      subtitle: 'Your heart, strictly on your device.',
      icon: '🛡️',
      features: [
        'Works fully offline',
        'No data leaves your device',
        'No account registration required',
        'Completely private and secure',
      ],
    },
    {
      title: 'Choose How to Start',
      accent: 'How to Start',
      subtitle: "Guidance for your heart, rooted in the\nQur'an and Sunnah.",
      isPlanSelection: true,
      freePlan: {
        title: 'Free',
        badge: 'CURRENT',
        icon: '✨',
        features: ['Daily guidance', 'All 8 moods', "Verified Qur'an & Hadith", '3 turns daily'],
      },
      premiumPlan: {
        title: 'Premium',
        badge: 'POPULAR',
        icon: '💎',
        price: 'AED 10.99',
        features: [
          '14 Spiritual Paths (Career, Salah, etc.)',
          'Unlimited daily guidance',
          'Audio recitations',
          'Unlimited saves & collections',
          'Deeper spiritual context',
        ],
      },
    },
  ];

  const handleNext = () => {
    if (currentPage < screens.length - 1) {
      // Scroll to next page
      scrollViewRef.current?.scrollTo({ x: SCREEN_WIDTH * (currentPage + 1), animated: true });
      setCurrentPage(currentPage + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleDotPress = (index: number) => {
    scrollViewRef.current?.scrollTo({ x: SCREEN_WIDTH * index, animated: true });
    setCurrentPage(index);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (pageIndex !== currentPage && pageIndex >= 0 && pageIndex < screens.length) {
      setCurrentPage(pageIndex);
    }
  };

  const renderSlide = (screen: any, index: number) => {
    if (screen.isPlanSelection) {
      return (
        <ScrollView
          key={index}
          style={styles.planSlide}
          contentContainerStyle={styles.planSlideContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.planHeaderArea}>
            <Text style={styles.planMainTitle}>
              Choose <Text style={styles.planMainTitleAccent}>How to Start</Text>
            </Text>
            <Text style={styles.planSubtitle}>{screen.subtitle}</Text>
          </View>

          {/* FREE PLAN CARD */}
          <View style={styles.planCard}>
            <View style={styles.cardTopRow}>
              <View>
                <Text style={styles.badgeText}>{screen.freePlan.badge}</Text>
                <Text style={styles.cardTitle}>{screen.freePlan.title}</Text>
              </View>
              <View style={styles.cardIconBox}>
                <Text style={styles.cardIconSmall}>✦</Text>
              </View>
            </View>

            <View style={styles.featureList}>
              {screen.freePlan.features.map((f: string, i: number) => (
                <View key={i} style={styles.featureRow}>
                  <Text style={styles.featureDot}>•</Text>
                  <Text style={styles.featureTextSmall}>{f}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.ghostButton} onPress={() => onComplete('free')}>
              <Text style={styles.ghostButtonText}>Continue with Free</Text>
            </TouchableOpacity>
          </View>

          {/* PREMIUM PLAN CARD */}
          <View style={[styles.planCard, styles.premiumCardBorder]}>
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>{screen.premiumPlan.badge}</Text>
            </View>
            <View style={styles.cardTopRow}>
              <View>
                <Text style={styles.elevatedBadge}>ELEVATED</Text>
                <Text style={styles.cardTitlePremium}>{screen.premiumPlan.title}</Text>
                <Text style={styles.cardPrice}>
                  {screen.premiumPlan.price} <Text style={styles.monthText}>/month</Text>
                </Text>
              </View>
              <View style={styles.topRightArea}></View>
            </View>

            <Text style={styles.everythingPlus}>EVERYTHING IN FREE, PLUS:</Text>

            <View style={styles.featureList}>
              {screen.premiumPlan.features.map((f: string, i: number) => (
                <View key={i} style={styles.featureRow}>
                  <View style={styles.checkCirclePremium}>
                    <Text style={styles.checkMarkPremium}>✓</Text>
                  </View>
                  <Text style={styles.featureTextPremium}>{f}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.filledButton} onPress={() => onComplete('premium')}>
              <Text style={styles.filledButtonText}>Try Free for 7 Days</Text>
            </TouchableOpacity>
            <Text style={styles.noCommitmentText}>No commitment. Cancel anytime.</Text>
          </View>

          {/* SPECIAL PATHS ROW */}
          {/* SPECIAL PATHS ROW */}
          <View style={styles.specialPathsCard}>
            <TouchableOpacity
              style={styles.specialPathsHeader}
              activeOpacity={0.7}
              onPress={() => setIsSpecialPathsExpanded(!isSpecialPathsExpanded)}
            >
              <View style={styles.specialIconCircle}>
                <Text style={styles.specialIconText}>💡</Text>
              </View>
              <View style={styles.specialTextContent}>
                <Text style={styles.specialRowTitle}>Special Paths</Text>
                <Text style={styles.specialRowSub}>One-time purchases</Text>
              </View>
              <Ionicons
                name={isSpecialPathsExpanded ? 'chevron-down' : 'chevron-forward'}
                size={20}
                color="rgba(255, 255, 255, 0.2)"
              />
            </TouchableOpacity>

            {isSpecialPathsExpanded && (
              <View style={styles.specialPathsDetails}>
                <Text style={styles.specialPathsDetailsText}>
                  Specialized collections for life's biggest milestones like Ramadan, Hajj, or the
                  New Parent journey. Pay once from AED 32.99 and keep forever.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      );
    }

    return (
      <View key={index} style={styles.slide}>
        {/* Logo/Icon Area */}
        <View style={styles.iconContainer}>
          <Text style={styles.mainIcon}>{screen.icon}</Text>
        </View>

        {/* Title and Subtitle */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {screen.title.replace(screen.accent, '')}
            <Text style={styles.titleAccent}>{screen.accent}</Text>
          </Text>
          <Text style={styles.subtitle}>{screen.subtitle}</Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          {screen.features.map((feature: string, featureIndex: number) => (
            <View key={featureIndex} style={styles.featureItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F12" />

      {/* Horizontal Swipeable Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.horizontalScroll}
        contentContainerStyle={styles.horizontalScrollContent}
      >
        {screens.map((screen, index) => renderSlide(screen, index))}
      </ScrollView>

      {/* Fixed Bottom Section */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 24) + 60 }]}>
        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          {screens.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.dot, index === currentPage && styles.activeDot]}
              onPress={() => handleDotPress(index)}
              activeOpacity={0.7}
            />
          ))}
        </View>

        {/* Action Buttons */}
        {currentPage < screens.length - 1 && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
              <Text style={styles.nextText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F12',
  },
  horizontalScroll: {
    flex: 1,
  },
  horizontalScrollContent: {
    flexGrow: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mainIcon: {
    fontSize: 64,
    color: '#2ED3C6',
    textAlign: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: '#2ED3C6',
    fontStyle: 'italic',
    fontWeight: '400',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.70)',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  bullet: {
    fontSize: 16,
    color: '#2ED3C6',
    marginRight: 12,
    marginTop: 2,
  },
  featureText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.90)',
    lineHeight: 24,
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: 32,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.30)',
  },
  activeDot: {
    backgroundColor: '#2ED3C6',
    width: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  skipButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  skipText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.60)',
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: '#2ED3C6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
    shadowColor: '#2ED3C6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextText: {
    fontSize: 16,
    color: '#0B0F12',
    fontWeight: '600',
    textAlign: 'center',
  },

  // ELEVATED PLAN STYLES
  planSlide: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  planSlideContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  planHeaderArea: {
    alignItems: 'center',
    marginBottom: 8,
  },
  planMainTitle: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
    textAlign: 'center',
    marginBottom: 12,
  },
  planMainTitleAccent: {
    color: '#2ED3C6',
    fontStyle: 'italic',
    fontWeight: '400',
  },
  planSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  planHeaderDivider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  planCard: {
    backgroundColor: '#121A1F',
    borderRadius: 24,
    padding: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  premiumCardBorder: {
    borderColor: 'rgba(94, 141, 126, 0.3)',
    backgroundColor: '#121A1F', // Dark theme consistency
    overflow: 'hidden',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  recommendedText: {
    color: '#2ED3C6',
  },
  cardTitle: {
    fontSize: 32, // Match Premium size
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 2,
  },
  cardPrice: {
    fontSize: 24, // Reduced from 32
    fontWeight: '800',
    color: '#FFFFFF',
  },
  monthText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumIconBox: {
    backgroundColor: 'rgba(46, 211, 198, 0.1)',
  },
  cardIconSmall: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.3)',
  },
  premiumDiamond: {
    fontSize: 18,
    color: '#2ED3C6',
  },
  everythingPlus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5E8D7E',
    letterSpacing: 1,
    marginBottom: 16,
    marginTop: 8,
  },
  featureList: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureDot: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.3)',
    marginRight: 10,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(46, 211, 198, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkMark: {
    fontSize: 12,
    color: '#2ED3C6',
    fontWeight: '800',
  },
  featureTextSmall: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
  },
  ghostButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  ghostButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filledButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#2ED3C6', // Using the signature teal in dark mode
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#2ED3C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionHighlightRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
    marginTop: 8,
  },
  actionPreviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  actionPreviewLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  filledButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B0F12',
  },
  elevatedBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5E8D7E',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  cardTitlePremium: {
    fontSize: 32, // Match Free size
    fontFamily: 'Amiri-Regular',
    color: '#FFFFFF',
    marginBottom: 4,
    fontWeight: '700',
  },
  topRightArea: {
    alignItems: 'flex-end',
  },
  popularBadge: {
    backgroundColor: '#5E8D7E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomLeftRadius: 16,
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  premiumDiamondIcon: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 12,
  },
  checkCirclePremium: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#2ED3C6', // Using the signature teal in dark mode
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkMarkPremium: {
    fontSize: 11,
    color: '#2ED3C6',
    fontWeight: '900',
  },
  featureTextPremium: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  noCommitmentText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  billingNoteSub: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  specialPathsCard: {
    backgroundColor: '#161F29',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 8,
    overflow: 'hidden',
  },
  specialPathsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  specialPathsDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingLeft: 72, // Align with text content
  },
  specialPathsDetailsText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
  },
  specialIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  specialIconText: {
    fontSize: 18,
    color: '#D4AF37',
  },
  specialTextContent: {
    flex: 1,
  },
  specialRowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  specialRowSub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 2,
  },
});

export default OnboardingScreen;
