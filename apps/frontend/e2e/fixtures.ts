import { test as base, expect } from '@playwright/test';

/** Extends the base test with a loaded home page before each test. */
export const test = base.extend<{ homePage: boolean }>({
  homePage: [
    async ({ page }, use) => {
      await page.goto('/');
      await use(true);
    },
    { auto: true },
  ],
});

export { expect };
