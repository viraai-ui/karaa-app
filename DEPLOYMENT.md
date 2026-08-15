# Karaa web/API deployment

The durable API uses Socket.IO and writable SQLite, so it must run as one long-lived process with a persistent disk. `render.yaml` describes that topology.

## Temporary Vercel demo API

The repository-root `api/[...route].ts` is a temporary request/response adapter for demos while a durable service is unavailable. It exposes the existing routes both at `/api/v1/...` and, via rewrites, `/v1/...`. It stores SQLite (including uploaded media) at `/tmp/karaa-demo.sqlite`: data can reset on any cold start and separate function instances can see different data. Socket.IO is deliberately disabled; clients must refresh/poll for changes. Responses include `x-karaa-demo-storage: ephemeral` and `x-karaa-realtime: disabled`.

Create a separate Vercel project rooted at the **repository root**, set `KARAA_JWT_SECRET` to a long random value and optionally set `KARAA_WEB_ORIGINS` to exact comma-separated HTTPS origins. The default origin is `https://karaa-global-app.vercel.app`. From the repository root, deploy with:

```sh
npx vercel --prod
```

Then rebuild the static web project with `VITE_KARAA_API_BASE_URL` set to this API project's HTTPS URL. Do not use this adapter for real/customer data.

## Deploy sequence

1. Create the Render Blueprint from this repository. The Starter instance and persistent disk are intentional: do not scale beyond one instance while the datastore is SQLite.
2. Set `KARAA_WEB_ORIGINS` to the exact HTTPS web origin(s), comma separated. Never use `*`; bearer-authenticated API responses and media are private.
3. In Vercel, set `VITE_KARAA_API_BASE_URL` to the Render service URL (without a trailing slash), then rebuild the web project. Vite embeds this at build time.
4. Verify `/health`, login, an authenticated project read, media retrieval, and a Socket.IO message/update flow from the deployed mobile browser.

`KARAA_DATABASE_PATH` defaults to in-memory storage for local/test use. A persistent deployment must point it at the mounted disk. The API enables WAL and a busy timeout and preserves an existing schema on restart.

## Security and production limits

This is production-capable hosting for the **audience demo**, not production identity for real users. It seeds three shared accounts with the documented `demo-password`; do not store real/customer data until seed credentials are removed, account provisioning/password reset are implemented, login rate limiting is added, and secret rotation/revocation is designed. JWTs expire after one hour and are accepted only through the Authorization header. Keep TLS at the managed hosts and keep CORS restricted to exact origins.

SQLite is safe only for this single-instance topology. Horizontal scaling needs a shared transactional datastore (for example PostgreSQL), migrations, and external object storage for uploaded media. Render disk snapshots/backups must also be configured before treating records as durable business data.
