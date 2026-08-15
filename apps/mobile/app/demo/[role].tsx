import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { OfflineAppShell } from '../../src/demo/OfflineAppShell';
import { demoAccounts, type OfflineDemoRole } from '../../src/demo/offline-demo';

export default function OfflineDemoRoute() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: string }>();
  if (!role || !demoAccounts.some((account) => account.role === role)) return <Redirect href="/login" />;

  return <OfflineAppShell onSwitchRole={(nextRole) => router.replace(`/demo/${nextRole}` as never)} role={role as OfflineDemoRole} />;
}
