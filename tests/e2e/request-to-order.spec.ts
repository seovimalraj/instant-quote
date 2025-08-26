import { test, expect } from '@playwright/test';

test.skip(process.env.PLAYWRIGHT !== '1', 'Skipped unless PLAYWRIGHT=1');

test('customer can request quote to order', async ({ page }) => {
  await page.goto('/instant-quote?partId=1&quoteId=1');
  await page.getByRole('button', { name: 'Request Quote' }).click();
  await expect(page.getByText('Quote requested successfully')).toBeVisible();
});
