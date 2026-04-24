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
      <BlurView intensity={20} style={StyleSheet.absoluteFill}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.content}>
            <LinearGradient colors={['#0F766E', '#115E59']} style={styles.header}>
              <Text style={styles.headerTitle}>Select Location</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.form}>
              <Text style={styles.description}>
                Enter your city and country to fetch accurate prayer times. This information is
                stored privately on your device.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>City</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="business-outline" size={20} color="#0F766E" />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. London"
                    value={city}
                    onChangeText={setCity}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Country</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="earth-outline" size={20} color="#0F766E" />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. United Kingdom"
                    value={country}
                    onChangeText={setCountry}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <TouchableOpacity onPress={handleSave} disabled={isLoading}>
                <LinearGradient colors={['#D4A574', '#B88B58']} style={styles.saveButton}>
                  {isLoading ? (
                    <ActivityIndicator color="#0B4D49" />
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
    padding: 24,
  },
  content: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    padding: 24,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B4D49',
  },
});
