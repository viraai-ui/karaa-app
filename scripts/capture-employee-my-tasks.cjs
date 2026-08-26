const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const width of [480, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 1238 }, deviceScaleFactor: 1 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('http://127.0.0.1:8087/demo/employee', { waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: 'My Tasks' }).click();
    await page.getByText('ACTIVE PACKAGE').waitFor();

    for (const filter of ['All', 'Pending', 'Upload', 'Completed']) {
      await page.getByRole('tab', { name: filter, exact: true }).click();
      if (filter === 'Pending') await page.getByText('Verify cable tagging').waitFor();
      if (filter === 'Upload') await page.getByText('Submit safety observation').waitFor();
      if (filter === 'Completed' && await page.getByText('Verify cable tagging').count()) throw new Error(`${width}: Completed retained pending tasks`);
    }
    await page.getByRole('tab', { name: 'All', exact: true }).click();

    await page.getByRole('button', { name: 'Upload Capture inverter cabinet photos' }).click();
    await page.getByText('UPLOAD EVIDENCE').waitFor();
    await page.getByRole('button', { name: 'Close task sheet' }).click();
    await page.getByRole('button', { name: 'Open Verify cable tagging details' }).click();
    await page.getByText('TASK DETAILS').waitFor();
    await page.getByRole('button', { name: 'Close task sheet' }).click();
    await page.getByRole('button', { name: 'View all submissions' }).click();
    await page.getByText('Row commissioning note', { exact: true }).waitFor();

    await page.getByRole('tab', { name: 'Attendance' }).click();
    await page.getByTestId('employee-attendance-page').waitFor();
    await page.getByRole('tab', { name: 'My Tasks' }).click();
    await page.getByTestId('employee-my-tasks').waitFor();
    await page.locator('[aria-label$="submission image"]').first().waitFor({ state: 'visible' });
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(() => ({ body: document.body.scrollWidth, root: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    if (overflow.body > overflow.viewport || overflow.root > overflow.viewport) throw new Error(`${width}: horizontal overflow ${JSON.stringify(overflow)}`);

    const out = path.resolve(`artifacts/employee-my-tasks-${width}px.png`);
    await page.screenshot({ path: out, fullPage: true });
    console.log(`${width}px screenshot=${out} page=${await page.title()} height=${await page.evaluate(() => document.documentElement.scrollHeight)}`);
    await page.close();
  }
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
