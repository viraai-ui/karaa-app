# Known limitations and evidence boundary

## Online/API-authoritative operation

Karaa is an **online, API-authoritative demo**. The app may retain only the encrypted authentication session locally. Project records, progress updates, evidence, conversations, notifications, and management actions are created and read through the API; they are not available as ordinary offline project data and are not queued for later synchronization.

A failed request must remain a failed request. The approved connection message is:

> `Connection unavailable — try again.`

The local API used during development and smoke verification is an API dependency, not evidence of offline product operation. The smoke flow starts an isolated local Fastify/SQLite instance solely to make the server-authoritative path repeatable.

## QA scope

- QA evidence is **PC browser + local API only**. Browser rendering and local API/runtime checks are the supported scope.
- This repository makes **no physical-device** installation, interaction, or performance claim.
- This repository makes **no camera** capture or media-library permission claim on a physical device.
- This repository makes **no real GPS/location** claim. The audience/demo location state is explicitly simulated unless separately validated.
- This repository makes **no hosted, deployed, or production-service** claim. The documented endpoint is a private local development API.

## Demo content disclosure

- Projects, people, progress, dates, locations, notifications, field records, and conversations are deterministic fictional **demo data**. They are not real client, site, operational, financial, safety, or contractual evidence.
- Images in `apps/mobile/assets/demo/` are generated demo visuals for the fictional Amaravati Solar Commons narrative. They are not photographs of a real project or verified field evidence. See [DEMO-ASSET-ATTRIBUTION.md](DEMO-ASSET-ATTRIBUTION.md).
- A smoke-test upload demonstrates that the local API persists bytes and enforces membership authorization. It does not authenticate a real-world image, construction fact, camera capture, GPS reading, or hosted storage integration.

## What the repeatable smoke proves

`npm run demo:smoke` uses actual local HTTP requests against an ephemeral Fastify server and isolated SQLite database. It proves one Employee update is persisted, that authenticated Customer and Management requests can read that update through canonical project endpoints, that a Management reply is persisted, and that an authenticated Employee can read it through the canonical conversation endpoint. It does not substitute for device, camera, GPS, hosting, production-security, or realtime-client delivery validation.
