import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KaraaBrand } from '../src/components/KaraaBrand';

const DESKTOP_BREAKPOINT = 768;

export default function RootLayout() {
  const { width } = useWindowDimensions();

  // This is intentionally a web-only gate. The Expo app remains the single
  // implementation on phones and native devices; wide browsers do not get a
  // second, desktop interpretation of the mobile product.
  if (Platform.OS === 'web' && width >= DESKTOP_BREAKPOINT) {
    return <DesktopMobileNotice />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="demo/[role]" />
        <Stack.Screen name="customer" />
        <Stack.Screen name="employee" />
        <Stack.Screen name="management" />
      </Stack>
    </SafeAreaProvider>
  );
}

function DesktopMobileNotice() {
  return (
    <View accessibilityLabel="KARAA is designed for mobile" style={styles.desktopGate} testID="desktop-mobile-notice">
      <KaraaBrand height={72} variant="crown" />
      <KaraaBrand height={24} style={styles.noticeBrand} variant="wordmark" />
      <Text style={styles.noticeEyebrow}>MOBILE EXPERIENCE</Text>
      <Text style={styles.noticeTitle}>Open KARAA on your phone</Text>
      <Text style={styles.noticeCopy}>This experience is designed for a mobile screen. Please visit this page from your phone or reduce the browser window to continue.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  desktopGate: {
    alignItems: 'center',
    backgroundColor: '#050605',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  noticeMark: {
    alignItems: 'center',
    borderColor: '#B39457',
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    marginBottom: 16,
    width: 52,
  },
  noticeMarkText: { color: '#B39457', fontSize: 34, fontWeight: '900', lineHeight: 40 },
  noticeBrand: { marginTop: 14 },
  noticeEyebrow: { color: '#B39457', fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginTop: 8 },
  noticeTitle: { color: '#F5F1E8', fontSize: 30, fontWeight: '800', lineHeight: 36, marginTop: 30, textAlign: 'center' },
  noticeCopy: { color: '#AAA79F', fontSize: 15, lineHeight: 23, marginTop: 12, maxWidth: 440, textAlign: 'center' },
});
