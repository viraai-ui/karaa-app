import { Redirect } from 'expo-router';

import { KaraaScreen } from '../src/components/KaraaScreen';
import { offlineDemoModeEnabled } from '../src/demo/offline-demo';

export default function Index() {
  if (offlineDemoModeEnabled({ EXPO_PUBLIC_KARAA_DEMO_MODE: process.env.EXPO_PUBLIC_KARAA_DEMO_MODE })) {
    return <Redirect href="/login" />;
  }

  return <KaraaScreen />;
}
