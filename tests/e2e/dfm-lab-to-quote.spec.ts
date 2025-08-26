import { test, expect } from '@playwright/test';

test.skip(process.env.PLAYWRIGHT !== '1', 'Skipped unless PLAYWRIGHT=1');

test('DFM lab to instant quote flow', async ({ page }) => {
  await page.goto('/dfm-lab');
  await page.getByRole('button', { name: 'Upload Part' }).setInputFiles('fixtures/parts/plate_10x10x2.stl');
  await page.getByLabel('Material').selectOption('Aluminum 6061');
  await page.getByLabel('Tolerance').selectOption('ISO 2768-m');
  await page.getByLabel('Certifications').check('ISO 9001');
  await page.getByRole('button', { name: 'Analyze' }).click();
  await expect(page.getByText('DFM Report')).toBeVisible();
  await page.getByRole('button', { name: 'Generate QAP' }).click();
  await page.getByRole('button', { name: 'Create Instant Quote' }).click();
  await expect(page.getByText('$')).toBeVisible();
});
