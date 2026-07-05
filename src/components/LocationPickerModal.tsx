import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Animated,
  PanResponder,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Animations } from '../theme/DesignSystem';
import { UserLocation } from '../services/locationStorage';
import { LocationCompass } from './LocationCompass';
import { useReduceMotion } from '../hooks/useReduceMotion';

interface LocationPickerModalProps {
  visible: boolean;
  currentLocation?: UserLocation;
  onClose: () => void;
  onLocationSelected: (location: UserLocation) => void;
}

const SHEET_MAX_HEIGHT_RATIO = 0.85;
const DRAG_CLOSE_THRESHOLD = 120;
const DRAG_CLOSE_VELOCITY = 1.2;

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  onClose,
  onLocationSelected,
}) => {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();

  // Bumped every time the sheet opens — forces LocationCompass to remount so
  // its internal phase (idle/locating/found/manual) always starts fresh.
  const [openId, setOpenId] = useState(0);
  const lastLocationRef = useRef<UserLocation | null>(null);

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const handleClose = () => {
    if (reduceMotion) {
      onClose();
      return;
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: Animations.timing.fast,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: Animations.timing.fast,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  // PanResponder is created once via useRef, but must always invoke the
  // *latest* handleClose (which closes over reduceMotion/screenHeight) — route
  // through a ref so the gesture handler never calls a stale closure.
  const handleCloseRef = useRef(handleClose);
  handleCloseRef.current = handleClose;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        gesture.dy > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > DRAG_CLOSE_THRESHOLD || gesture.vy > DRAG_CLOSE_VELOCITY) {
          handleCloseRef.current();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            ...Animations.spring.gentle,
          }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      setOpenId((n) => n + 1);
      lastLocationRef.current = null;
    }
  }, [visible]);

  // Separate from the state-reset effect above so that a mid-session change to
  // reduceMotion or screenHeight (device rotation, toggling OS Reduce Motion
  // while the sheet is open) only replays the open animation.
  useEffect(() => {
    if (!visible) return;
    if (reduceMotion) {
      translateY.setValue(0);
      backdropOpacity.setValue(1);
    } else {
      translateY.setValue(screenHeight);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          ...Animations.spring.gentle,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: Animations.timing.normal,
          useNativeDriver: true,
        }),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, reduceMotion, screenHeight]);

  const handleComplete = () => {
    if (lastLocationRef.current) onLocationSelected(lastLocationRef.current);
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}
          pointerEvents="none"
        >
          <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
        </Animated.View>
        <TouchableWithoutFeedback onPress={handleClose} accessibilityRole="button" accessibilityLabel="Dismiss location picker">
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.content,
              { maxHeight: screenHeight * SHEET_MAX_HEIGHT_RATIO, transform: [{ translateY }] },
            ]}
          >
            <View style={styles.handleBar} {...panResponder.panHandlers} />
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={22} color={Colors.text.secondary} />
            </TouchableOpacity>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <LocationCompass
                key={openId}
                compassSize={180}
                paddingTop={Spacing.sm}
                paddingBottom={Math.max(insets.bottom, Spacing.lg)}
                onResolved={(location) => { lastLocationRef.current = location; }}
                onComplete={handleComplete}
              />
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    width: '100%',
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.accent.muted,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 235, 210, 0.2)',
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.lg,
    padding: Spacing.xs,
    zIndex: 2,
  },
});
