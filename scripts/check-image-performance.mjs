import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const productionRoots = ['apps/mobile/assets', 'apps/web/public'];
const rasterExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif']);
const pngAllowlist = new Set([
  // Expo/Android require PNG launch and application artwork.
  'apps/mobile/assets/brand/adaptive-icon.png',
  'apps/mobile/assets/brand/app-icon.png',
  'apps/mobile/assets/brand/favicon.png',
  'apps/mobile/assets/brand/splash-icon.png',
  // Tiny transparent fade strips: WebP is larger or risks edge ringing.
  'apps/mobile/assets/subverticals/multi-specialty-hospitals/hero-left-fade.png',
  'apps/mobile/assets/verticals/white-fade-left.png',
  // PWA and Apple install metadata require broadly compatible PNG icons.
  'apps/web/public/icons/apple-touch-icon.png',
  'apps/web/public/icons/karaa-icon-192.png',
  'apps/web/public/icons/karaa-icon-512.png',
]);
const maxBytesAllowlist = new Set([
  'apps/mobile/assets/brand/adaptive-icon.png',
  'apps/mobile/assets/brand/app-icon.png',
  'apps/mobile/assets/brand/splash-icon.png',
]);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('dist')) continue;
    const item = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(item));
    else files.push(item);
  }
  return files;
}

function webpDimensions(buffer) {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') return null;
  const kind = buffer.toString('ascii', 12, 16);
  if (kind === 'VP8X') return [1 + buffer.readUIntLE(24, 3), 1 + buffer.readUIntLE(27, 3)];
  if (kind === 'VP8 ') return [buffer.readUInt16LE(26) & 0x3fff, buffer.readUInt16LE(28) & 0x3fff];
  if (kind === 'VP8L') {
    const bits = buffer.readUInt32LE(21);
    return [1 + (bits & 0x3fff), 1 + ((bits >> 14) & 0x3fff)];
  }
  return null;
}

const failures = [];
let count = 0;
let bytes = 0;
for (const productionRoot of productionRoots) {
  for (const absolute of await walk(path.join(root, productionRoot))) {
    const extension = path.extname(absolute).toLowerCase();
    if (!rasterExtensions.has(extension)) continue;
    const relative = path.relative(root, absolute).split(path.sep).join('/');
    const size = (await stat(absolute)).size;
    count += 1; bytes += size;
    if (['.jpg', '.jpeg', '.gif'].includes(extension)) failures.push(`${relative}: legacy photographic format`);
    if (extension === '.png' && !pngAllowlist.has(relative)) failures.push(`${relative}: PNG is not in the justified functional allowlist`);
    if (size > 400_000 && !maxBytesAllowlist.has(relative)) failures.push(`${relative}: ${size} bytes exceeds 400 KB`);
    if (extension === '.webp') {
      const dimensions = webpDimensions(await readFile(absolute));
      if (!dimensions) failures.push(`${relative}: unreadable WebP dimensions`);
      else {
        const [width, height] = dimensions;
        const maxDimension = relative.includes('/subverticals/generated/') ? 800 : relative.includes('/demo/') ? 1200 : relative.includes('/portfolio/') ? 1400 : 1600;
        if (Math.max(width, height) > maxDimension) failures.push(`${relative}: ${width}x${height} exceeds ${maxDimension}px policy`);
      }
    }
  }
}

// Prevent source code/manifests from quietly reintroducing heavy legacy assets.
for (const app of ['apps/mobile', 'apps/web']) {
  for (const absolute of await walk(path.join(root, app))) {
    if (!/\.(?:[cm]?[jt]sx?|json|html|css)$/.test(absolute)) continue;
    const relative = path.relative(root, absolute).split(path.sep).join('/');
    const source = await readFile(absolute, 'utf8');
    for (const match of source.matchAll(/["'`]([^"'`]*assets\/[^"'`]*\.(?:png|jpe?g|gif))["'`]/gi)) {
      const value = match[1];
      if (!value.includes('/brand/') && !value.includes('/icons/') && !value.includes('fade')) failures.push(`${relative}: legacy production asset reference ${value}`);
    }
  }
}

if (failures.length) {
  console.error(`Image performance guard failed (${failures.length}):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Image performance guard passed: ${count} production rasters, ${bytes} bytes; only modern photos and justified PNGs.`);
