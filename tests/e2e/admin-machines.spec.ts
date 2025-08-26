import { test, expect } from '@playwright/test';

test.skip(process.env.PLAYWRIGHT !== '1', 'Skipped unless PLAYWRIGHT=1');

test('admin can view machines list', async ({ page }) => {
  await page.goto('/admin/machines');
  await expect(page.getByRole('heading', { name: 'Machines' })).toBeVisible();
});
