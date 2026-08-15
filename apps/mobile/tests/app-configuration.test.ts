import appConfig from '../app.json';
import mobilePackage from '../package.json';

describe('Android-first native app configuration', () => {
  it('declares a native deep-link scheme and Android application ID without web support', () => {
    expect(appConfig.expo.scheme).toBe('karaa');
    expect(appConfig.expo.android?.package).toBe('com.karaa.mobile');
    expect(appConfig.expo.platforms).toEqual(['android']);
  });

  it('uses the release manifest plugin for the documented local HTTP demo API', () => {
    expect(appConfig.expo.plugins).toContain('./plugins/with-release-cleartext-traffic');
  });

  it('does not advertise unsupported platform runtimes', () => {
    expect('web' in mobilePackage.scripts).toBe(false);
    expect('ios' in mobilePackage.scripts).toBe(false);
  });

  it('blocks Expo permissions the shell does not use', () => {
    expect(appConfig.expo.android?.blockedPermissions).toEqual([
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.USE_BIOMETRIC',
      'android.permission.USE_FINGERPRINT',
    ]);
  });
});
