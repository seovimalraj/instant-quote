import { test, expect } from '@playwright/test';

test.skip(process.env.PLAYWRIGHT !== '1', 'Skipped unless PLAYWRIGHT=1');

test('customer can view instant quote page', async ({ page }) => {
  await page.goto('/instant-quote');
  await expect(page.getByRole('heading', { name: 'Instant Quote' })).toBeVisible();
});
