#!/usr/bin/env node
const { execSync } = require('child_process');

try {
  // Ensure Playwright browsers are installed for e2e tests
  execSync('npx playwright install --with-deps chromium', { stdio: 'inherit' });
} catch {
  // Non-fatal in environments without Playwright
  console.warn('Playwright install skipped');
}
