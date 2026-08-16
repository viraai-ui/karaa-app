# Karaa demo visual assets

These images are **original synthetic demo visuals**, generated for the Karaa audience demo on 2026-08-11. They depict the fictional `Amaravati Solar Commons` project and must never be presented as photographed client work, live field evidence, verified construction status, or a safety record.

Every product surface displaying one of these assets must show the visible caption: `Demo visual`.

| File | Intended use | Dimensions | Generation constraints | SHA-256 |
| --- | --- | --- | --- | --- |
| `amaravati-hero.webp` | public tour / project hero | 1536x864 px (16:9) | fictional solar site overview at dawn; no text, people, logos, or safety claims | `d6bb4b9cf5f8220225103f7349f9a3974ddd766609995195ef4f94b968288ee6` |
| `amaravati-pour.webp` | construction-stage evidence card | 1448x1086 px | fictional drainage and footing pour; no text, people, logos, or safety claims | `96292aef7b55f5127123747bf0efa887ac5f481c096e3adfb45b56737a5eb1ca` |
| `amaravati-structure.webp` | construction-stage evidence card | 1448x1086 px | fictional solar support structure and conduits; no text, people, logos, or safety claims | `8ef6f292f01879388b849467c5aa1e440b77fbe76851219474d3664b35231405` |
| `amaravati-finish.webp` | completed-area evidence card | 1448x1086 px | fictional solar rows and service route; no numeric completion claim, text, people, logos, or safety claims | `8bea184d5b104dc32677cde63a84d3d57ffa3bc36d778b71f45b6ba6bf2c31a8` |
| `amaravati-inverter-evidence.webp` | Employee/Customer evidence card | 1448x1086 px | fictional solar inverter installation and cable trays; no text, people, logos, or safety claims | `58ec971625bf512a53dc35ecb3b5a85a92dca450198615d7b9585aed79ffebde` |
| `amaravati-solar-hero.webp` | Karaa Global project hero | 1536x1024 px | fictional Amaravati solar-campus overview; no text, people, logos, or safety claims | `bad93b10d39a8a9e58c87bafd04b90350f467ad0a9b9bd03102b0ed3ff19fc18` |
| `amaravati-inverter-inspection.webp` | Employee field-review and customer evidence surface | 1536x1024 px | fictional inverter-row inspection and commissioning evidence; no text, people, logos, or safety claims | `d518cc73b86f7e1db329b67ee34f1c0978f971a43272efa7d7187250f58dde30` |
| `amaravati-structure-progress.webp` | Tender, project-progress, and management surface | 1536x1024 px | fictional Amaravati structural-progress evidence; no text, people, logos, or safety claims | `88508afe63bccde654e4fa64510b43307c7c9210438ffef5939a25d3f72a50eb` |

## Visual QA record

All five assets were inspected on 2026-08-11. They contain no readable text, branding/watermark, identifiable person, accidental UI, or misleading factual claim embedded in the pixels. They form a warm construction-progress narrative: site overview → pour → structure → inverter installation → finish. The inverter image is a supporting fictional demo visual only; it becomes no more authoritative than any other asset until an authenticated Employee upload creates a persisted record.

`manifest.json` and `scripts/verify-demo-assets.mjs` are the canonical machine-verifiable integrity and declared-provenance records. They verify the local asset set, byte integrity, dimensions, required labels, and declared metadata; the generation/ownership statement above remains a project attestation. If an asset is replaced, update its description, dimensions, visual-QA record, and checksum in the same change. See `docs/DEMO-ASSET-ATTRIBUTION.md` for the policy governing future external material.
