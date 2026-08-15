import { OfflineAppShell } from './OfflineAppShell';
import type { OfflineDemoRole } from './offline-demo';

export function OfflineDemoScreen({ onReturn = () => undefined, role }: { role: OfflineDemoRole; onReturn?: () => void }) {
  return <OfflineAppShell onSwitchRole={() => onReturn()} role={role} />;
}
