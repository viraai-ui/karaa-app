# Local browser demo setup

Karaa is an online-only local demo: the browser uses the local API/database as the record of truth. It does not queue project actions or keep project data for offline use; the browser stores only its authenticated session for the current tab session.

## Start the local browser/API pair

Run these commands from the repository root.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the API environment file:

   ```bash
   cp .env.example .env
   ```

3. Generate a high-entropy local signing secret and put it in `KARAA_DEMO_JWT_SECRET`. Do not use the placeholder value:

   ```bash
   openssl rand -hex 32
   ```

4. Set `KARAA_WEB_ORIGINS` to the exact browser origin allowed to call the API directly. The safe default is `http://127.0.0.1:4173`. If Vite chooses another port, set that exact origin instead—for example, `http://127.0.0.1:4177`. Never use `*`.

5. Start the API:

   ```bash
   npm run dev:api
   ```

6. In a second terminal, start the browser client:

   ```bash
   npm run dev --workspace=@karaa/web
   ```

Open the exact Vite URL printed in the terminal. Development uses the Vite same-origin proxy for `/v1`; the explicit API CORS allowlist protects an intentionally configured direct-browser/API seam.

## Repeatable API handoff smoke

From the repository root, run:

```bash
npm run demo:smoke
```

It starts an isolated local API/database and proves the server-authoritative Employee → Customer/Management → Management → Employee flow through real local HTTP requests. It does not prove offline operation, real camera/GPS, hosting/deployment, production readiness, or physical-device behavior. See [KNOWN-LIMITATIONS.md](KNOWN-LIMITATIONS.md).