# Production image policy

Karaa uses WebP as its photographic source format because Expo supports it consistently on Android and web. AVIF is intentionally not used: the current React Native `Image`/Metro asset path cannot safely select an AVIF web source while retaining a native WebP fallback.

Run `npm run test:images` from the repository root. The guard rejects JPG/JPEG/GIF assets, non-allowlisted PNGs, photos above 400 KB, and dimensions beyond their rendered-use budgets (800 px generated cards, 1200 px demo galleries, 1400 px portfolio cards, and 1600 px other hero/detail imagery).

## Retained PNG exceptions

- `apps/mobile/assets/brand/{adaptive-icon,app-icon,favicon,splash-icon}.png`: Expo/Android application, adaptive, splash, and favicon configuration requires broadly supported functional PNG artwork.
- `apps/mobile/assets/subverticals/multi-specialty-hospitals/hero-left-fade.png` (636 bytes) and `apps/mobile/assets/verticals/white-fade-left.png` (141 bytes): tiny alpha-only fade strips; conversion does not improve transfer size and may introduce edge ringing.
- `apps/web/public/icons/{apple-touch-icon,karaa-icon-192,karaa-icon-512}.png`: PWA/Apple installation metadata compatibility.

Expo export also contains tiny PNGs owned by Expo Router under `node_modules`; these are third-party framework UI assets and must not be modified.