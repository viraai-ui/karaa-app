const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * The local demo API is intentionally HTTP on the private LAN. Expo's built-in
 * usesCleartextTraffic option only writes the debug manifest, so apply this to
 * the main manifest as well for the privately distributed release APK.
 */
function withReleaseCleartextTraffic(config) {
  return withAndroidManifest(config, (androidConfig) => {
    const application = androidConfig.modResults.manifest.application?.[0];

    if (!application) {
      throw new Error('AndroidManifest.xml must contain an application element.');
    }

    application.$ = {
      ...application.$,
      'android:usesCleartextTraffic': 'true',
    };

    return androidConfig;
  });
}

module.exports = withReleaseCleartextTraffic;
