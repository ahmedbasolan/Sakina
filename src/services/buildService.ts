/**
 * Build Service
 *
 * Probes the native environment at runtime to detect available capabilities.
 * Helps the app adjust behavior gracefully in stale development builds.
 */

export interface BuildCapabilities {
  notifications: boolean;
  haptics: boolean;
  audio: boolean;
  sqlite: boolean;
  isDevelopmentClient: boolean;
}

let capabilities: BuildCapabilities | null = null;

const probeNotifications = (): boolean => {
  try {
    const module = require('expo-notifications');
    return !!module.setNotificationHandler;
  } catch (_e) {
    return false;
  }
};

const probeHaptics = (): boolean => {
  try {
    const module = require('expo-haptics');
    return !!module.impactAsync;
  } catch (_e) {
    return false;
  }
};

const probeAudio = (): boolean => {
  try {
    const module = require('expo-audio');
    return !!module.createAudioPlayer || !!module.useAudioPlayer;
  } catch (_e) {
    return false;
  }
};

const probeSqlite = (): boolean => {
  try {
    const module = require('expo-sqlite');
    return !!module.openDatabaseAsync;
  } catch (_e) {
    return false;
  }
};

const probeDevClient = (): boolean => {
  try {
    require('expo-dev-client');
    return true;
  } catch (_e) {
    return false;
  }
};

export const BuildService = {
  /**
   * Probe the environment and return capabilities
   */
  getCapabilities: (): BuildCapabilities => {
    if (capabilities) return capabilities;

    // Detection logic
    capabilities = {
      notifications: probeNotifications(),
      haptics: probeHaptics(),
      audio: probeAudio(),
      sqlite: probeSqlite(),
      // Most dev builds will have expo-dev-client
      isDevelopmentClient: probeDevClient(),
    };

    return capabilities;
  },

  /**
   * Check if the app is in "Degraded Mode" (missing core native features)
   */
  isDegradedMode: (): boolean => {
    const caps = BuildService.getCapabilities();
    // Consider degraded if fundamental features like audio or haptics are missing
    return !caps.haptics || !caps.audio || !caps.notifications;
  },

  /**
   * Get a human-readable status report
   */
  getStatusReport: () => {
    const caps = BuildService.getCapabilities();
    return {
      status: BuildService.isDegradedMode() ? 'Degraded (Stale Build)' : 'Full (Healthy)',
      details: caps,
      recommendation: BuildService.isDegradedMode()
        ? "Some native features are missing. If you've recently added dependencies, run 'npx expo run:android' or 'npx expo run:ios' to rebuild your development client."
        : 'Your build is fully functional with all native modules linked.',
    };
  },
};
