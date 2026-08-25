import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Animated,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { FrostedSurface } from './FrostedSurface';
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

  // The gesture below is built once via useMemo, but must always invoke the
  // *latest* handleClose (which closes over reduceMotion/screenHeight) — route
  // through a ref so it never calls a stale closure.
  const handleCloseRef = useRef(handleClose);
  handleCloseRef.current = handleClose;

  const springToRest = () => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      ...Animations.spring.gentle,
    }).start();
  };

  // DRAG_CLOSE_VELOCITY (1.2) was tuned against PanResponder's vy, which was
  // pixels per MILLISECOND. RNGH's velocityY is pixels per SECOND (Android's
  // VelocityTracker.computeCurrentVelocity(1000); iOS's
  // UIPanGestureRecognizer.velocityInView:, documented in points/second) —
  // 1000x larger unit, same physical flick. See useSwipeGesture.ts for the
  // fuller version of this note.
  const dragGesture = useMemo(
    () =>
      Gesture.Pan()
        // Single positive number = one-directional: stays inactive for any
        // upward movement (range (-inf, 4)) and activates once the drag
        // passes 4px downward — matches the old `gesture.dy > 4`, which never
        // claimed at all on an upward move.
        .activeOffsetY(4)
        .failOffsetX([-15, 15])
        .onUpdate((e) => {
          if (e.translationY > 0) translateY.setValue(e.translationY);
        })
        .onEnd((e, success) => {
          if (!success) return;
          if (e.translationY > DRAG_CLOSE_THRESHOLD || e.velocityY > DRAG_CLOSE_VELOCITY * 1000) {
            handleCloseRef.current();
          } else {
            springToRest();
          }
        })
        .onFinalize((_e, success) => {
          // Guarded on `!success` — deliberately NOT unconditional, which is
          // the opposite of useSwipeGesture's onFinalize. There, the value
          // being reset is a decorative overlay nothing else animates, so an
          // always-reset is safe. Here the successful path calls handleClose,
          // which is itself animating translateY out to screenHeight — an
          // unconditional spring back to 0 would race that close animation and
          // yank the sheet back up mid-dismiss. This only catches the case
          // onEnd cannot see: a drag that activated and was then cancelled
          // (onEnd never fires at all), which otherwise strands the sheet
          // parked halfway down the screen.
          if (!success) springToRest();
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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
      {/* RN's Modal renders its content in a separate native root (its own
          UIWindow on iOS, its own Dialog window on Android) that sits outside
          the app-root GestureHandlerRootView in App.tsx — react-native-gesture-
          handler's gestures silently do nothing inside a Modal without their
          own nested root. */}
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}
          pointerEvents="none"
        >
          {/* Modal scrim. iOS blurs the app behind the sheet; Android never
              did (no experimentalBlurMethod), and expo-blur's neutral-grey
              fallback at this intensity is only ~17% opaque, which barely
              separated the sheet from the screen. A navy scrim reads much
              closer to what iOS actually shows. */}
          <FrostedSurface
            intensity={24}
            androidFill="rgba(7, 15, 26, 0.5)"
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <TouchableWithoutFeedback onPress={handleClose} accessibilityRole="button" accessibilityLabel="Dismiss location picker">
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
          pointerEvents="box-none"
        >
          <Animated.View style={[styles.sheetShadow, { transform: [{ translateY }] }]}>
            <View style={[styles.content, { maxHeight: screenHeight * SHEET_MAX_HEIGHT_RATIO }]}>
              <GestureDetector gesture={dragGesture}>
                <View style={styles.handleBar} />
              </GestureDetector>
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
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  // Shadow only, no clipping — the split exists because Android can't combine
  // `elevation` with `overflow:'hidden'` + a border radius on one view without
  // the shadow's rounded-rect backing showing through the clip (the same fault
  // ShareSheet.tsx's previewCardShadow works around). Unlike SwipeNextOverlay,
  // the clip here is load-bearing: it's what rounds the ScrollView's top
  // corners, so it can't simply be dropped. It keeps the top radii so Android
  // casts the shadow along the sheet's real silhouette rather than a square.
  sheetShadow: {
    width: '100%',
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  // Clipping + surface. maxHeight is applied to THIS view (at the call site)
  // rather than the shadow wrapper above: the clamp has to live on the view
  // that also clips, or a tall LocationCompass would just overflow the
  // wrapper now that the wrapper no longer has `overflow: 'hidden'`.
  content: {
    width: '100%',
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.accent.muted,
    borderBottomWidth: 0,
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
