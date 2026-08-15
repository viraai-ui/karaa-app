import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const repoRoot = path.resolve(webRoot, '../..');
const runOffset = Number(process.env.KARAA_E2E_PORT_OFFSET ?? Math.floor(Math.random() * 500));
const apiPort = 44_000 + runOffset;
const webPort = 45_000 + runOffset;
const apiUrl = `http://127.0.0.1:${apiPort}`;
const webUrl = `http://127.0.0.1:${webPort}`;
const evidencePath = path.join(repoRoot, 'apps/mobile/assets/demo/amaravati-inverter-evidence.png');
const artifactsDir = path.join(repoRoot, 'artifacts/browser-e2e');
const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const evidenceText = `PC browser field record ${stamp}`;
const supportText = `PC browser support check ${stamp}`;
const directText = `PC browser management handoff ${stamp}`;
const issueText = `PC browser intervention ${stamp}`;

const children = [];
const outcome = {
  stamp,
  consoleErrors: [],
  apiFailures: [],
  employee: {},
  customer: {},
  management: {},
  signOut: {},
};

function start(command, args, environment) {
  const child = spawn(command, args, {
    cwd: repoRoot,
    detached: true,
    env: { ...process.env, ...environment },
    stdio: 'pipe',
  });
  children.push(child);
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  child.once('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`${command} ${args.join(' ')} exited ${code}\n${output}`);
    }
  });
  return child;
}

async function waitForHealthy(url, processName) {
  const deadline = Date.now() + 30_000;
  let lastError = 'not attempted';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`${processName} did not become healthy at ${url}: ${lastError}`);
}

async function closeChildren() {
  for (const child of children.reverse()) {
    if (child.pid) {
      try {
        process.kill(-child.pid, 'SIGTERM');
      } catch (error) {
        if (!(error instanceof Error) || !('code' in error) || error.code !== 'ESRCH') throw error;
      }
    }
  }
  await Promise.all(children.map(async (child) => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    await Promise.race([
      once(child, 'exit'),
      new Promise((resolve) => setTimeout(resolve, 5_000)),
    ]);
    if (child.exitCode === null && child.signalCode === null && child.pid) {
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch (error) {
        if (!(error instanceof Error) || !('code' in error) || error.code !== 'ESRCH') throw error;
      }
    }
  }));
}

async function signIn(browser, buttonName, heading) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') outcome.consoleErrors.push({ role: buttonName, message: message.text() });
  });
  page.on('response', (response) => {
    if (response.url().includes('/v1/') && response.status() >= 400) {
      outcome.apiFailures.push({ role: buttonName, status: response.status(), url: new URL(response.url()).pathname });
    }
  });
  await page.goto(`${webUrl}/sign-in`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: buttonName }).click();
  await page.getByRole('button', { name: 'Sign in to Karaa' }).click();
  await page.getByRole('heading', { name: heading }).waitFor();
  return { context, page };
}

try {
  await rm(artifactsDir, { recursive: true, force: true });
  await mkdir(artifactsDir, { recursive: true });
  start('npm', ['run', 'dev:api'], {
    KARAA_API_HOST: '127.0.0.1',
    KARAA_API_PORT: String(apiPort),
    KARAA_DEMO_JWT_SECRET: randomBytes(32).toString('hex'),
    KARAA_WEB_ORIGINS: webUrl,
  });
  await waitForHealthy(`${apiUrl}/health`, 'API');
  start('npm', ['run', 'dev', '--workspace=@karaa/web', '--', '--host', '127.0.0.1', '--port', String(webPort)], {
    VITE_KARAA_API_PROXY_TARGET: apiUrl,
  });
  await waitForHealthy(webUrl, 'browser app');

  const browser = await chromium.launch({ headless: true });
  try {
    const publicPage = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    await publicPage.goto(webUrl, { waitUntil: 'networkidle' });
    await publicPage.getByRole('heading', { name: /evidence becomes accountable/i }).waitFor();
    await publicPage.screenshot({ path: path.join(artifactsDir, 'public-tour.png'), fullPage: true });
    await publicPage.close();

    {
      const { context, page } = await signIn(browser, 'Employee walkthrough', 'Employee workspace');
      await page.getByRole('heading', { name: 'Publish progress update' }).waitFor();
      await page.getByRole('button', { name: 'Use simulated PC location' }).click();
      await page.getByRole('status').filter({ hasText: 'Field location saved to Karaa' }).waitFor();
      await page.getByLabel('Work completed').fill(evidenceText);
      await page.getByLabel('Claimed progress (%)').fill('67');
      await page.getByLabel('Crew count').fill('4');
      await page.getByLabel('Crew hours').fill('24');
      await page.getByLabel('Site conditions').fill('Clear and dry PC browser demonstration conditions.');
      await page.getByLabel('Next action').fill('Management to inspect the browser-persisted field record.');
      await page.getByLabel('Evidence photo').setInputFiles(evidencePath);
      await page.getByRole('button', { name: 'Publish progress update' }).click();
      await page.locator('[role="status"]').filter({ hasText: /^Saved to Karaa$/ }).waitFor({ timeout: 15_000 });
      await page.waitForFunction(() => document.querySelector('textarea[aria-label="Work completed"]')?.value === '');
      await page.waitForFunction(() => document.querySelector('input[aria-label="Evidence photo"]')?.value === '');
      await page.getByText(evidenceText).waitFor();
      outcome.employee = {
        locationSaved: true,
        progressSaved: true,
        canonicalUpdateVisible: await page.getByText(evidenceText).count() > 0,
        formCleared: true,
      };
      await page.screenshot({ path: path.join(artifactsDir, 'employee.png'), fullPage: true });
      await context.close();
    }

    {
      const { context, page } = await signIn(browser, 'Customer walkthrough', 'Your customer workspace');
      await page.getByRole('heading', { name: 'Saved update' }).waitFor();
      await page.getByText(evidenceText).waitFor({ timeout: 15_000 });
      const evidenceImage = page.getByRole('img', { name: 'Saved field evidence' });
      await evidenceImage.waitFor();
      await page.waitForFunction(() => {
        const image = document.querySelector('img[alt="Saved field evidence"]');
        return image?.complete && image.naturalWidth > 0;
      });
      await page.getByRole('textbox', { name: 'Support message' }).fill(supportText);
      await page.getByRole('button', { name: 'Send support message' }).click();
      await page.getByText(supportText).waitFor({ timeout: 15_000 });
      outcome.customer = {
        canonicalEmployeeUpdateVisible: true,
        protectedEvidenceImageLoaded: await evidenceImage.evaluate((image) => image.naturalWidth > 0),
        supportPersistedAfterReload: await page.getByText(supportText).count() > 0,
      };
      await page.screenshot({ path: path.join(artifactsDir, 'customer.png'), fullPage: true });
      await context.close();
    }

    {
      const { context, page } = await signIn(browser, 'Management walkthrough', 'Command Centre');
      await page.getByRole('heading', { name: 'Authorized field locations' }).waitFor();
      await page.getByText('Dev Employee', { exact: true }).first().waitFor({ timeout: 15_000 });
      await page.getByText('Presentation simulator — not a real location').waitFor();
      await page.getByLabel('Intervention description').fill(issueText);
      await page.getByLabel('Root cause').fill('Browser handoff verification requires a persisted intervention.');
      await page.getByRole('button', { name: 'Save intervention' }).click();
      await page.getByText(issueText).waitFor({ timeout: 15_000 });
      await page.getByRole('button', { name: 'Resolve intervention' }).click();
      await page.getByText('No open interventions.').waitFor({ timeout: 15_000 });
      await page.getByRole('button', { name: /Open direct thread with Dev Employee/ }).click();
      await page.getByLabel('Direct reply').waitFor({ timeout: 15_000 });
      await page.getByLabel('Direct reply').fill(directText);
      await page.getByRole('button', { name: 'Send direct reply' }).click();
      await page.getByText(directText).waitFor({ timeout: 15_000 });
      outcome.management = {
        simulatedLocationVisible: true,
        issueCreatedAndResolved: true,
        directMessagePersistedAfterReload: await page.getByText(directText).count() > 0,
        canonicalEmployeeUpdateVisible: await page.getByText('67% delivery recorded').count() > 0,
      };
      await page.screenshot({ path: path.join(artifactsDir, 'management.png'), fullPage: true });
      await context.close();
    }

    {
      const { context, page } = await signIn(browser, 'Employee walkthrough', 'Employee workspace');
      await page.getByText(directText).waitFor({ timeout: 15_000 });
      outcome.employee.managementReplyVisibleAfterReload = await page.getByText(directText).count() > 0;
      await context.close();
    }

    {
      const { context, page } = await signIn(browser, 'Customer walkthrough', 'Your customer workspace');
      await page.getByText('Sign out', { exact: true }).click();
      await page.getByRole('heading', { name: /evidence becomes accountable/i }).waitFor({ timeout: 15_000 });
      outcome.signOut = {
        publicTourVisible: true,
        sessionRemoved: await page.evaluate(() => sessionStorage.getItem('karaa.browser.session.v1') === null),
      };
      await context.close();
    }
  } finally {
    await browser.close();
  }

  if (outcome.consoleErrors.length || outcome.apiFailures.length) {
    throw new Error(`Browser errors detected: ${JSON.stringify(outcome)}`);
  }
  console.log(JSON.stringify(outcome, null, 2));
} finally {
  await closeChildren();
}
