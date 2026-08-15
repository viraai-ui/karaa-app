import appConfig from '../app.json';
import mobilePackage from '../package.json';

describe('Android-first native app configuration', () => {
  it('keeps the native Android identity while enabling the mobile web build', () => {
    expect(appConfig.expo.scheme).toBe('karaa');
    expect(appConfig.expo.android?.package).toBe('com.karaa.mobile');
    expect(appConfig.expo.platforms).toEqual(['android', 'web']);
    expect(appConfig.expo.web).toEqual({ bundler: 'metro', output: 'single' });
  });

  it('uses the release manifest plugin for the documented local HTTP demo API', () => {
    expect(appConfig.expo.plugins).toContain('./plugins/with-release-cleartext-traffic');
  });

  it('advertises the supported Android and web runtimes only', () => {
    expect(mobilePackage.scripts.web).toBe('expo start --web');
    expect(mobilePackage.scripts['export:web']).toContain('expo export --platform web');
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
