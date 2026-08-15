import { RoleGate } from '../../src/RoleGate';
import { CustomerProjectScreen } from '../../src/features/customer/CustomerProjectScreen';

export default function CustomerHome() {
  return (
    <RoleGate requiredRole="customer">
      <CustomerProjectScreen />
    </RoleGate>
  );
}
