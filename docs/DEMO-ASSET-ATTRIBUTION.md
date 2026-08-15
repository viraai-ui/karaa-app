# Karaa demo-asset attribution

The five images listed in `apps/mobile/assets/demo/manifest.json` are original synthetic visuals generated for the Karaa audience demo on 2026-08-11. They depict the fictional **Amaravati Solar Commons** programme.

## Truthfulness rules

- Every in-product use must visibly say **`Demo visual`**.
- None represents a real client site, live field evidence, verified construction status, safety record, or contractual project fact.
- Images support the audience narrative only. Progress, dates, people, actions, locations, and notifications must come from Karaa's server-authoritative demo data and carry their own appropriate demo/status labelling.
- Do not use a real project logo, watermark, or identifiable worker image in this asset set.

## Future external material

Before an official or third-party asset is included, record its source URL, retrieval date, and documented usage basis in this file and add it to the asset manifest. Do not imply ownership merely because an image is publicly reachable.

## Verification

Run the following from the repository root after changing a visual or its provenance:

```bash
node --test tests/demo-assets.test.mjs
node scripts/verify-demo-assets.mjs
```
