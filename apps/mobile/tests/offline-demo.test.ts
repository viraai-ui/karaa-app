import {
  createOfflineDemoState,
  demoAccounts,
  offlineDemoModeEnabled,
  offlineDemoReducer,
  offlineDemoStore,
  offlineRoleTabs,
} from '../src/demo/offline-demo';

describe('Karaa Global standalone demo model', () => {
  it('exposes the three guided Karaa workspaces', () => {
    expect(demoAccounts).toEqual([
      expect.objectContaining({ role: 'customer', email: 'anika.customer@karaa.demo', displayName: 'Anika Customer' }),
      expect.objectContaining({ role: 'employee', email: 'dev.employee@karaa.demo', displayName: 'Dev Employee' }),
      expect.objectContaining({ role: 'management', email: 'mira.management@karaa.demo', displayName: 'Mira Management' }),
    ]);
  });

  it('enables the isolated demo boundary only for the explicit build flag', () => {
    expect(offlineDemoModeEnabled({ EXPO_PUBLIC_KARAA_DEMO_MODE: 'true' })).toBe(true);
    expect(offlineDemoModeEnabled({ EXPO_PUBLIC_KARAA_DEMO_MODE: 'false' })).toBe(false);
    expect(offlineDemoModeEnabled({})).toBe(false);
  });

  it('uses the approved Karaa Global navigation per role', () => {
    expect(offlineRoleTabs.customer.map((tab) => tab.label)).toEqual(['Power of 9', 'Tenders', 'My Portfolio', 'Support']);
    expect(offlineRoleTabs.employee.map((tab) => tab.label)).toEqual(['Power of 9', 'Tenders', 'My Work', 'Chat']);
    expect(offlineRoleTabs.management.map((tab) => tab.label)).toEqual(['Power of 9', 'Tenders', 'Command Centre', 'Geo Location', 'Chat']);
  });

  it('propagates an employee update to every active workspace through one process-local state store', () => {
    offlineDemoStore.reset();
    offlineDemoStore.dispatch({ type: 'review-field-update' });

    expect(offlineDemoStore.getState().currentProgress).toBe(68);
    expect(offlineDemoStore.getState().fieldUpdateReviewed).toBe(true);
    offlineDemoStore.reset();
  });
});
