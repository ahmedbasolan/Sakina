import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/DesignSystem';
import { saveUserLocation, UserLocation } from '../services/locationStorage';
import PrayerTimesService from '../services/prayerTimesService';

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelected: (location: UserLocation) => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  onClose,
  onLocationSelected,
}) => {
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!city || !country) {
      Alert.alert('Incomplete Information', 'Please provide both city and country.');
      return;
    }

    setIsLoading(true);
    try {
      const prayerService = PrayerTimesService.getInstance();
      // Validate location by attempting a fetch
      await prayerService.getTimingsByCity(city, country);

      const newLocation = { city, country };
      await saveUserLocation(newLocation);
      onLocationSelected(newLocation);
      onClose();
    } catch (error: any) {
      Alert.alert(
        'Location Error',
        `We couldn't find prayer times for ${city}, ${country}. Please check the spelling.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons name="location-outline" size={20} color={Colors.accent.primary} />
                <Text style={styles.headerTitle}>Set Location</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color="rgba(245, 237, 227, 0.7)" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.description}>
                Enter your city and country for accurate prayer times. This stays private and is
                stored only on your device.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>City</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="business-outline" size={18} color={Colors.accent.primary} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. London"
                    value={city}
                    onChangeText={setCity}
                    placeholderTextColor="rgba(245, 237, 227, 0.35)"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Country</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="earth-outline" size={18} color={Colors.accent.primary} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. United Kingdom"
                    value={country}
                    onChangeText={setCountry}
                    placeholderTextColor="rgba(245, 237, 227, 0.35)"
                  />
                </View>
              </View>

              <TouchableOpacity onPress={handleSave} disabled={isLoading} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#E8C84A', '#B8860B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveButton}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.background.secondary} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Location</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  content: {
    width: '100%',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.accent.muted,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.h2,
    color: Colors.text.primary,
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  form: {
    padding: Spacing.xl,
  },
  description: {
    fontSize: Typography.sizes.small,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.sizes.small,
    fontWeight: '600',
    color: Colors.text.secondary,
    letterSpacing: 0.3,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: Colors.accent.muted,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
  },
  saveButton: {
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveButtonText: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.body,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.background.secondary,
  },
});
