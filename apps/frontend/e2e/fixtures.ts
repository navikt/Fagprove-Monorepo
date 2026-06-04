import { test as base, expect } from '@playwright/test';
import { SOKNADER_API_PATH, VEDTAK_API_PATH } from '../src/lib/foreldrepenger';
import { seedSoknaderResponse } from '../src/mocks/foreldrepenger-seed';

/** Extends the base test with a loaded home page before each test. */
export const test = base.extend<{ homePage: boolean }>({
  homePage: [
    async ({ page }, use) => {
      await page.route(`**${SOKNADER_API_PATH}`, async (route) => {
        await route.fulfill({ json: seedSoknaderResponse });
      });
      await page.route(`**${VEDTAK_API_PATH}`, async (route) => {
        const body = route.request().postDataJSON() as { soknadId?: string };
        await route.fulfill({
          status: 201,
          json: {
            sakId: 1001,
            soknadId: body.soknadId,
            status: 'FERDIGSTILT',
            vedtaksvariant: 'INNVILGET',
            regelspor: [],
          },
        });
      });

      await page.goto('/');
      await use(true);
    },
    { auto: true },
  ],
});

export { expect };
