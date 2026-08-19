import { Redirect } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { loadSession as defaultLoadSession, selectRoleRoute, type Role, type Session } from './lib/session';
import { KaraaBrand } from './components/KaraaBrand';

type GateState = 'loading' | 'unauthenticated' | Session;
type SessionLoader = () => Promise<Session | undefined>;

export function RoleGate({
  children,
  loadSession = defaultLoadSession,
  requiredRole,
}: {
  children: ReactNode;
  loadSession?: SessionLoader;
  requiredRole: Role;
}) {
  const [state, setState] = useState<GateState>('loading');

  useEffect(() => {
    void loadSession()
      .then((session) => setState(session ?? 'unauthenticated'))
      .catch(() => setState('unauthenticated'));
  }, [loadSession]);

  if (state === 'loading') {
    return (
      <View style={styles.loading}>
        <KaraaBrand height={54} variant="crown" />
        <ActivityIndicator />
        <Text>Opening your workspace…</Text>
      </View>
    );
  }
  if (state === 'unauthenticated') return <Redirect href="/login" />;
  if (state.user.role !== requiredRole) return <Redirect href={selectRoleRoute(state).pathname} />;

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: '#F8F5EE' },
});
