import { Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { selectRoleRoute, type Session } from './lib/session';
import { KaraaBrand } from './components/KaraaBrand';

export function RootEntry({ session }: { session: Session }) {
  const destination = selectRoleRoute(session);

  return (
    <View style={styles.container} accessibilityLabel={`Routing to ${destination.title}`}>
      <KaraaBrand height={56} variant="crown" />
      <Text style={styles.title}>{destination.title}</Text>
      <Redirect href={destination.pathname} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: '#FFFFFF' },
  title: { color: '#1E2521', fontSize: 24, fontWeight: '700' },
});
