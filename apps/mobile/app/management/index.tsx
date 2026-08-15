import { RoleGate } from '../../src/RoleGate';
import { ManagementWorkspace } from '../../src/features/management/ManagementWorkspace';

export default function ManagementHome() {
  return (
    <RoleGate requiredRole="management">
      <ManagementWorkspace />
    </RoleGate>
  );
}
