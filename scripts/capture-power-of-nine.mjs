import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const out = path.resolve('artifacts/power-of-nine');
await fs.mkdir(out, { recursive: true });
const routes = [
  ['public','/'], ['auth','/login'],
  ['customer-demo','/demo/customer'], ['employee-demo','/demo/employee'], ['management-demo','/demo/management'],
  ['customer-authenticated','/customer'], ['employee-authenticated','/employee'], ['management-authenticated','/management'],
];
const baseUrl = process.env.CAPTURE_BASE_URL ?? 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
for (const width of [320,390,480]) {
  const page = await browser.newPage({ viewport: { width, height: 844 }, deviceScaleFactor: 1 });
  for (const [name, route] of routes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(out, `${name}-${width}.png`), fullPage: true });
  }
  await page.close();
}
await browser.close();
console.log(`Captured ${routes.length * 3} screenshots in ${out}`);
