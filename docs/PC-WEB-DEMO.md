# Karaa PC-browser demo runbook

## Scope

Karaa is verified as a **PC browser + private local API** demo. It is not a hosted service, production deployment, physical-device validation, camera integration, real GPS integration, or offline-first app.

The browser reads and mutates project data through the API. It keeps only the authenticated session for the current tab session; it does not retain canonical project data or queue failed writes.

## Prerequisites

From the repository root:

```bash
npm install
npx playwright install chromium
```

The Playwright install is required only for the browser handoff runner. It installs the browser binary used by the test; it does not change Karaa product behavior.

## Start the demo interactively

1. Copy `.env.example` to `.env`.
2. Replace the placeholder `KARAA_DEMO_JWT_SECRET` with a new local value from:

   ```bash
   openssl rand -hex 32
   ```

3. Keep `KARAA_WEB_ORIGINS` set to the exact browser origin. The default is `http://127.0.0.1:4173`; never use `*`.
4. Start the local API:

   ```bash
   npm run dev:api
   ```

5. In another terminal start the browser client:

   ```bash
   npm run dev --workspace=@karaa/web
   ```

6. Open the printed Vite URL. Use the server-backed Customer, Employee, or Management walkthrough buttons, then submit the normal sign-in form. The server returns the role; there is no browser role selector.

Development proxies `/v1` to the local API. The direct API CORS boundary separately allows only configured `KARAA_WEB_ORIGINS` values.

## Repeatable browser handoff

Run this from the repository root:

```bash
npm run test:e2e --workspace=@karaa/web
```

The runner starts an isolated Fastify/SQLite audience-demo API and Vite server using temporary loopback ports and a fresh generated JWT secret. It then uses Chromium at 1440px to verify:

- public tour;
- Employee simulated-location disclosure, one-image multipart field record persistence, canonical refresh, and form reset;
- Customer canonical employee update, protected bearer-authenticated evidence image, and persisted support message;
- Management persisted simulated-location disclosure, issue create/resolve, and direct Employee message;
- Employee seeing the persisted Management reply after a new authenticated load;
- sign-out clearing `karaa.browser.session.v1`;
- no browser console errors or API responses at HTTP 400+.

It writes local screenshots under `artifacts/browser-e2e/`, which is ignored by Git. The runner terminates its temporary server process groups on exit.

## Truthful presentation wording

Keep these visible product boundaries intact:

- `Connection unavailable — try again.` means no action was persisted.
- `Presentation simulator — not a real location` labels PC-demo coordinates.
- `Demo visual` labels generated seeded imagery only.
- `Demo data — verify with issuing authority` labels fictional Customer records.

For broader limitations and the local HTTP-only smoke boundary, see [KNOWN-LIMITATIONS.md](KNOWN-LIMITATIONS.md) and [LOCAL-DEMO-SETUP.md](LOCAL-DEMO-SETUP.md).
