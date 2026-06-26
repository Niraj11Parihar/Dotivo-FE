const { withProjectBuildGradle, withSettingsGradle, createRunOncePlugin } = require('@expo/config-plugins');

/**
 * Fix for Point 2: Ensuring all modules (including local ones like :wallpaper)
 * have compileSdk specified when using Android SDK 36.
 */
const withAndroidSubprojectsFix = (config) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'gradle') {
      const subprojectsBlock = `
// Force compileSdk and targetSdk for all subprojects to ensure compatibility with SDK 36
subprojects {
  afterEvaluate { project ->
    if (project.hasProperty('android')) {
      project.android {
        if (compileSdk < 36) {
          compileSdk 36
        }
        if (defaultConfig.targetSdk < 36) {
          defaultConfig.targetSdk 36
        }
      }
    }
  }
}
`;
      if (!config.modResults.contents.includes('Force compileSdk')) {
        config.modResults.contents = config.modResults.contents + subprojectsBlock;
      }
    }
    return config;
  });
};

/**
 * Fix for Point 1: Ensuring autolinking is reliably set up in settings.gradle.
 */
const withAndroidSettingsFix = (config) => {
  return withSettingsGradle(config, (config) => {
    if (config.modResults.language === 'gradle') {
      // We ensure the modern useExpoModules() is present and call it as early as possible.
      if (!config.modResults.contents.includes('expoAutolinking.useExpoModules()')) {
          // If it's missing for some reason, we add it.
          config.modResults.contents += '\nexpoAutolinking.useExpoModules()\n';
      }
    }
    return config;
  });
};

const withAndroidFixes = (config) => {
  config = withAndroidSubprojectsFix(config);
  config = withAndroidSettingsFix(config);
  return config;
};

module.exports = createRunOncePlugin(withAndroidFixes, 'withAndroidFixes', '1.0.0');

