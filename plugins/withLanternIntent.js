/**
 * Puts LightLanternIntent.swift into the MAIN APP target at prebuild.
 *
 * The prayer card's lantern is a Button(intent:) running a LiveActivityIntent.
 * iOS runs that intent's perform() in the app's process and finds it through
 * the App Intents metadata Xcode extracts for the app target. An intent inside
 * our pod (a static library) is not extracted and fails with "could not find
 * intent", so the file is copied next to the app's own sources and added to
 * the application target here. The widget extension has its own identical
 * copy (targets/live-activity/LightLanternIntent.swift); the parity test keeps
 * the two byte-identical.
 *
 * It also weak-links AppIntents for the app target: the app deploys to iOS 15.1
 * and AppIntents first ships in iOS 16, so a strong link would stop the app
 * launching on iOS 15. The intent type itself is gated to iOS 17.2.
 *
 * What this does NOT prove: that the intent is found at run time, or that the
 * lantern lights. Only a device build shows that.
 */
const fs = require('fs');
const path = require('path');
const { withDangerousMod, withXcodeProject, IOSConfig } = require('expo/config-plugins');

const FILE = 'LightLanternIntent.swift';
const SOURCE = path.join('modules', 'sakina-live-activity', 'app-target', FILE);
const WEAK = '-weak_framework AppIntents';

function withLanternIntentFile(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const { projectRoot, platformProjectRoot, projectName } = cfg.modRequest;
      const dest = path.join(platformProjectRoot, projectName, FILE);
      fs.copyFileSync(path.join(projectRoot, SOURCE), dest);
      return cfg;
    },
  ]);
}

function withLanternIntentTarget(config) {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const projectName = cfg.modRequest.projectName;
    const filepath = `${projectName}/${FILE}`;
    if (!project.hasFile(filepath)) {
      // No targetUuid: Expo's helper picks the application target, never the
      // widget extension that @bacons/apple-targets adds.
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({ filepath, groupName: projectName, project });
    }

    const app = project.getTarget('com.apple.product-type.application');
    const listId = app && app.target.buildConfigurationList;
    const lists = project.pbxXCConfigurationList();
    const configs = project.pbxXCBuildConfigurationSection();
    const ids = listId && lists[listId] ? lists[listId].buildConfigurations.map((c) => c.value) : [];
    for (const id of ids) {
      const settings = configs[id] && configs[id].buildSettings;
      if (!settings) continue;
      let flags = settings.OTHER_LDFLAGS;
      if (flags == null) flags = ['"$(inherited)"'];
      if (!Array.isArray(flags)) flags = [flags];
      if (!flags.some((f) => String(f).includes('weak_framework AppIntents'))) {
        flags.push(`"${WEAK}"`);
      }
      settings.OTHER_LDFLAGS = flags;
    }
    return cfg;
  });
}

module.exports = function withLanternIntent(config) {
  return withLanternIntentTarget(withLanternIntentFile(config));
};
