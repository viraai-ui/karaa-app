import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
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
