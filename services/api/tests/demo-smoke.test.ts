import { describe, expect, it } from 'vitest';

import { runDemoFlow } from '../../../scripts/demo-smoke.mjs';

describe('local cross-role smoke flow', () => {
  it('persists an employee update, exposes it through authorized canonical reads, and returns a persisted management reply to the employee', async () => {
    const result = await runDemoFlow();

    expect(result.employeePersistedUpdate).toBe(true);
    expect(result.customerSawAuthorizedCanonicalUpdate).toBe(true);
    expect(result.managementSawAuthorizedCanonicalUpdate).toBe(true);
    expect(result.managementPersistedReply).toBe(true);
    expect(result.employeeSawAuthorizedCanonicalReply).toBe(true);
    expect(result.progressUpdateRows).toBe(1);
    expect(result.messageRows).toBe(1);
  });
});
