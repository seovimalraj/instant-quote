import { test, expect } from '@playwright/test';

test.describe('dfm page', () => {
  test.skip(process.env.PLAYWRIGHT !== '1', 'Skipped unless PLAYWRIGHT=1');

  test('dfm page loads', async ({ page }) => {
    await page.goto('/dfm');
    await expect(page.getByText('Analyze')).toBeVisible();
  });
});
