import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDemoAssets } from './demo-asset-validation.mjs';

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rootFlagIndex = process.argv.indexOf('--root');
const root = rootFlagIndex === -1 ? defaultRoot : resolve(process.argv[rootFlagIndex + 1] ?? '');

for (const asset of validateDemoAssets(root)) {
  console.log(`OK ${asset.path} — ${asset.width}x${asset.height}`);
}
