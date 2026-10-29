// Widget extension for the prayer Live Activity (Dynamic Island + lock screen).
// Read by @bacons/apple-targets at `expo prebuild`; see its README for keys.
//
// - The App Group is mirrored from app.json so the app and the extension can
//   never disagree on it (the extension reads the verse snapshot from there).
// - `images.lantern` is cut from the brand icon by scripts/build-lantern-assets.js;
//   pointing at that output (not a copy) means a re-run reaches the card too.
// - Colours are the Celestial Night tokens from src/theme/DesignSystem.ts. The
//   SwiftUI views use their own sRGB constants (LiveActivityStyle.swift); these
//   two only feed the system's widget background / accent build settings.

/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'SakinaLiveActivity',
  displayName: 'Sakina',
  deploymentTarget: '17.2',
  frameworks: ['SwiftUI', 'WidgetKit', 'ActivityKit'],
  colors: {
    $widgetBackground: '#07111E',
    $accent: '#D4AF37',
  },
  images: {
    lantern: '../../src/assets/brand/lantern.png',
  },
  entitlements: {
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
});
