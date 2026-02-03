import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaywallType } from '../types';

interface PaywallScreenProps {
  paywallType: PaywallType;
  onUpgrade: () => void;
  onMaybeLater: () => void;
  onBack: () => void;
}

const PaywallScreen: React.FC<PaywallScreenProps> = ({
  paywallType,
  onUpgrade,
  onMaybeLater,
  onBack,
}) => {
  const getPaywallContent = () => {
    switch (paywallType.type) {
      case 'daily_limit':
        return {
          title: "You've used your 2 daily sessions",
          subtitle: paywallType.remainingTime
            ? `Come back in ${paywallType.remainingTime} hours for new guidance, or upgrade to Premium for unlimited daily access.`
            : 'Come back tomorrow for new guidance, or upgrade to Premium for unlimited daily access.',
          features: [
            'Unlimited daily guidance sessions',
            'Audio recitations',
            'Unlimited saves',
            '7-day spiritual paths',
          ],
        };

      case 'refresh_limit':
        return {
          title: "You've used your 3 refreshes",
          subtitle: 'Premium unlocks unlimited Next to explore all guidance options.',
          features: [
            'Unlimited Next (explore all guidance)',
            'Audio recitations',
            'Save unlimited items',
            '7-day spiritual paths',
          ],
        };

      case 'saved_limit':
        return {
          title: 'Save is a Premium feature',
          subtitle: 'Upgrade to Premium to save unlimited reflections and guidance.',
          features: [
            'Save unlimited items',
            'Unlimited daily guidance sessions',
            'Audio recitations',
            'Extended history (never repeat for 90 days)',
            '7-day spiritual paths',
          ],
        };

      default:
        return {
          title: 'Upgrade to Premium',
          subtitle: 'Unlock the full Islamic guidance experience.',
          features: [
            'Unlimited daily guidance sessions',
            'Audio recitations',
            'Save unlimited items',
            '7-day spiritual paths',
          ],
        };
    }
  };

  const content = getPaywallContent();

  return (
    <View style={styles.container}>
      {/* TOP APP BAR */}
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Premium</Text>
        <View style={styles.placeholder} />
      </View>

      {/* CONTENT */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* ILLUSTRATION AREA */}
          <View style={styles.illustration}>
            <View style={styles.iconContainer}>
              <Text style={styles.premiumIcon}>✦</Text>
            </View>
          </View>

          {/* TITLE */}
          <Text style={styles.title}>{content.title}</Text>

          {/* SUBTITLE */}
          <Text style={styles.subtitle}>{content.subtitle}</Text>

          {/* FEATURES LIST */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Premium also unlocks:</Text>

            {content.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* UPGRADE BUTTON */}
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <Text style={styles.upgradeButtonText}>Start Free Trial</Text>
          </TouchableOpacity>

          {/* MAYBE LATER */}
          <TouchableOpacity style={styles.maybeLaterButton} onPress={onMaybeLater}>
            <Text style={styles.maybeLaterText}>Maybe Later</Text>
          </TouchableOpacity>
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

  // TOP APP BAR
  appBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'transparent',
  },

  appBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 44,
  },

  // CONTENT
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 20,
  },

  // ILLUSTRATION
  illustration: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(46, 211, 198, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(46, 211, 198, 0.3)',
  },
  premiumIcon: {
    fontSize: 32,
    color: '#2ED3C6',
    fontWeight: '600',
  },

  // TEXT
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.70)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 16,
  },

  // FEATURES
  featuresContainer: {
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#2ED3C6',
    fontWeight: '600',
    marginRight: 12,
    marginTop: 2,
  },
  featureText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.80)',
    lineHeight: 22,
    flex: 1,
  },

  // BUTTONS
  upgradeButton: {
    backgroundColor: '#2ED3C6',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2ED3C6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B0F12',
    letterSpacing: 0.5,
  },
  maybeLaterButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  maybeLaterText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.60)',
    fontWeight: '500',
  },
});

export default PaywallScreen;
