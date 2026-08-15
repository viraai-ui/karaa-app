# Karaa demo visual assets

These images are **original synthetic demo visuals**, generated for the Karaa audience demo on 2026-08-11. They depict the fictional `Amaravati Solar Commons` project and must never be presented as photographed client work, live field evidence, verified construction status, or a safety record.

Every product surface displaying one of these assets must show the visible caption: `Demo visual`.

| File | Intended use | Dimensions | Generation constraints | SHA-256 |
| --- | --- | --- | --- | --- |
| `amaravati-hero.png` | public tour / project hero | 1536x864 px (16:9) | fictional solar site overview at dawn; no text, people, logos, or safety claims | `c3891f9d1e088e88af3b3126fca7e71ff206f0b36654fce4db54b98f1e7b0c7b` |
| `amaravati-pour.png` | construction-stage evidence card | 1448x1086 px | fictional drainage and footing pour; no text, people, logos, or safety claims | `149b5526fa75c416ac717e22a8231e8006d31beb53b90bd3c6eb182e146c347c` |
| `amaravati-structure.png` | construction-stage evidence card | 1448x1086 px | fictional solar support structure and conduits; no text, people, logos, or safety claims | `d5a0a062122fd10994f1c817f3758af2e8599a6120fb374f2287143630f15f75` |
| `amaravati-finish.png` | completed-area evidence card | 1448x1086 px | fictional solar rows and service route; no numeric completion claim, text, people, logos, or safety claims | `942f251f35536e970cfd3a27ae9e7f105a1e029338837bf7f275b2891be6500f` |
| `amaravati-inverter-evidence.png` | Employee/Customer evidence card | 1448x1086 px | fictional solar inverter installation and cable trays; no text, people, logos, or safety claims | `f4568565f7fcdeb0bcf4c937a3f9061b611043cb5717dc138b65c30c1d13235a` |
| `amaravati-solar-hero.png` | Karaa Global project hero | 1536x1024 px | fictional Amaravati solar-campus overview; no text, people, logos, or safety claims | `c5657c911a9334f2af752ffb2c039dc2157ae171745cf6d86ca0d6aa7142b9c8` |
| `amaravati-inverter-inspection.png` | Employee field-review and customer evidence surface | 1536x1024 px | fictional inverter-row inspection and commissioning evidence; no text, people, logos, or safety claims | `24fe571c61e4b179bbb764bd6635ffd9a60027b88f5c2f33bce368c76a5a0cec` |
| `amaravati-structure-progress.png` | Tender, project-progress, and management surface | 1536x1024 px | fictional Amaravati structural-progress evidence; no text, people, logos, or safety claims | `152d5468faad855afd17cefd1660b83670cc3ddbdbafb8ee6356106ccfaee82d` |

## Visual QA record

All five assets were inspected on 2026-08-11. They contain no readable text, branding/watermark, identifiable person, accidental UI, or misleading factual claim embedded in the pixels. They form a warm construction-progress narrative: site overview → pour → structure → inverter installation → finish. The inverter image is a supporting fictional demo visual only; it becomes no more authoritative than any other asset until an authenticated Employee upload creates a persisted record.

`manifest.json` and `scripts/verify-demo-assets.mjs` are the canonical machine-verifiable integrity and declared-provenance records. They verify the local asset set, byte integrity, dimensions, required labels, and declared metadata; the generation/ownership statement above remains a project attestation. If an asset is replaced, update its description, dimensions, visual-QA record, and checksum in the same change. See `docs/DEMO-ASSET-ATTRIBUTION.md` for the policy governing future external material.
