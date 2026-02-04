import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PaywallType } from '../types';
import { FreemiumService } from '../services/freemiumService';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface PremiumPaywallScreenProps {
  paywallType: PaywallType;
  onUpgrade: (type: 'monthly' | 'yearly') => void;
  onRestore: () => void;
  onMaybeLater: () => void;
  onBack: () => void;
}

const PremiumPaywallScreen: React.FC<PremiumPaywallScreenProps> = ({
  paywallType,
  onUpgrade,
  onRestore,
  onMaybeLater,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isStartingTrial, setIsStartingTrial] = useState(false);

  const content = {
    title: 'Premium',
    subtitle: 'Everything in Free, plus:',
    features: [
      '14 Spiritual Paths (Career, Salah, etc.)',
      'Unlimited daily guidance',
      'Audio recitations',
      'Unlimited saves & collections',
      'Deeper spiritual context',
    ],
  };

  const handleStartTrial = async () => {
    setIsStartingTrial(true);
    try {
      const freemiumService = FreemiumService.getInstance();
      const success = await freemiumService.startTrial();

      if (success) {
        Alert.alert(
          'Trial Started! 🎉',
          'You now have 7 days of Premium access. Enjoy unlimited guidance and all premium features!',
          [{ text: 'Awesome!', onPress: onMaybeLater }],
        );
      } else {
        Alert.alert('Error', 'Could not start trial. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsStartingTrial(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1A2332', '#0B0F12']} style={StyleSheet.absoluteFill} />

      {/* TOP APP BAR */}
      <View style={[styles.appBar, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Premium Access</Text>
        <View style={styles.placeholder} />
      </View>

      {/* CONTENT */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}>
          {/* HEADER AREA */}
          {/* PREMIUM CARD */}
          <View style={styles.premiumCard}>
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>POPULAR</Text>
            </View>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.elevatedText}>ELEVATED</Text>
                <Text style={styles.premiumTitle}>Premium</Text>
                <Text style={styles.priceContainer}>
                  <Text style={styles.priceBold}>AED 10.99</Text>
                  <Text style={styles.priceLight}> / month</Text>
                </Text>
              </View>
              <View style={styles.topRightArea}></View>
            </View>

            <Text style={styles.everythingInFree}>{content.subtitle}</Text>

            <View style={styles.featureList}>
              {content.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <View style={styles.checkCircle}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* ACTION HIGHLIGHT PREVIEW */}
            <View style={styles.actionHighlightRow}>
              <View style={styles.actionPreviewButton}>
                <Ionicons name="bookmark-outline" size={16} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.actionPreviewLabel}>SAVE</Text>
              </View>
              <View style={styles.actionPreviewButton}>
                <Ionicons name="share-outline" size={16} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.actionPreviewLabel}>SHARE</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.mainButton}
              onPress={handleStartTrial}
              disabled={isStartingTrial}
            >
              <Text style={styles.mainButtonText}>
                {isStartingTrial ? 'Starting...' : 'Try Free for 7 Days'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={onMaybeLater}>
              <Text style={styles.secondaryButtonText}>Continue with Free</Text>
            </TouchableOpacity>

            <Text style={styles.noCommitment}>No commitment. Cancel anytime.</Text>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onRestore}>
              <Text style={styles.footerText}>Restore Purchase</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}>•</Text>
            <TouchableOpacity>
              <Text style={styles.footerText}>Terms of Use</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}>•</Text>
            <TouchableOpacity>
              <Text style={styles.footerText}>Privacy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F12',
  },
  appBar: {
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 48,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  appBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  premiumCard: {
    backgroundColor: '#121A1F', // Dark surface
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(94, 141, 126, 0.3)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  elevatedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5E8D7E',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  premiumTitle: {
    fontSize: 32,
    fontFamily: 'Amiri-Regular',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceBold: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  priceLight: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '400',
  },
  topRightArea: {
    alignItems: 'flex-end',
  },
  popularBadge: {
    backgroundColor: '#5E8D7E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomLeftRadius: 20,
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  diamondIcon: {
    fontSize: 24,
    color: '#7C8B91',
    marginTop: 20,
    opacity: 0.6,
  },
  everythingInFree: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5E8D7E',
    marginBottom: 24,
    marginTop: 10,
  },
  featureList: {
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2ED3C6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  checkMark: {
    fontSize: 12,
    color: '#2ED3C6',
    fontWeight: '900',
  },
  featureText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  mainButton: {
    backgroundColor: '#2ED3C6', // Use the brighter teal for dark mode pop
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
    shadowColor: '#2ED3C6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
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
  mainButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B0F12',
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  noCommitment: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'italic',
    textAlign: 'center',
    fontWeight: '400',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 40,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    textDecorationLine: 'underline',
  },
  footerDot: {
    color: 'rgba(255,255,255,0.15)',
    marginHorizontal: 12,
  },
  loadingText: {
    color: '#2ED3C6',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});

export default PremiumPaywallScreen;
