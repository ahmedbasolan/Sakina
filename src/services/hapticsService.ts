/**
 * Haptics Service
 *
 * Centrally manages haptic feedback with safety guards for native builds.
 * Prevents crashes if expo-haptics is missing from the current development build.
 */

let Haptics: any = null;

import { BuildService } from './buildService';

/**
 * Lazily load expo-haptics to prevent top-level import crashes
 */
const getHaptics = () => {
  if (Haptics) return Haptics;
  if (!BuildService.getCapabilities().haptics) return null;

  try {
    Haptics = require('expo-haptics');
    return Haptics;
  } catch (_error) {
    return null;
  }
};

export const HapticsService = {
  /**
   * Impact feedback
   */
  impactAsync: async (style: string = 'LIGHT') => {
    const module = getHaptics();
    if (!module) return;

    try {
      // ImpactFeedbackStyle mapping if string is passed
      let hapticStyle = module.ImpactFeedbackStyle.Light;
      if (style === 'MEDIUM') hapticStyle = module.ImpactFeedbackStyle.Medium;
      if (style === 'HEAVY') hapticStyle = module.ImpactFeedbackStyle.Heavy;

      await module.impactAsync(hapticStyle);
    } catch (_e) {
      // Silently fail to avoid crashing the whole app for just a haptic feedback
    }
  },

  /**
   * Notification feedback
   */
  notificationAsync: async (type: string = 'SUCCESS') => {
    const module = getHaptics();
    if (!module) return;

    try {
      let hapticType = module.NotificationFeedbackType.Success;
      if (type === 'WARNING') hapticType = module.NotificationFeedbackType.Warning;
      if (type === 'ERROR') hapticType = module.NotificationFeedbackType.Error;

      await module.notificationAsync(hapticType);
    } catch (_e) {
      // Silently fail
    }
  },

  /**
   * Selection feedback
   */
  selectionAsync: async () => {
    const module = getHaptics();
    if (!module) return;

    try {
      await module.selectionAsync();
    } catch (_e) {
      // Silently fail
    }
  },
};

/**
 * Re-exporting enum values for convenience (mocked if module missing)
 */
export const HapticImpact = {
  Light: 'LIGHT',
  Medium: 'MEDIUM',
  Heavy: 'HEAVY',
};

export const HapticNotification = {
  Success: 'SUCCESS',
  Warning: 'WARNING',
  Error: 'ERROR',
};
