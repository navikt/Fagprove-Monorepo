import { test as base, expect } from '@playwright/test';
import { SAKER_API_PATH, SOKNADER_API_PATH, VEDTAK_API_PATH } from '../src/lib/foreldrepenger';
import {
  getSeedSakIdForSoknad,
  getSeedSakResponseById,
  seedSoknaderResponse,
} from '../src/mocks/foreldrepenger-seed';

/** Extends the base test with a loaded home page before each test. */
export const test = base.extend<{ homePage: boolean }>({
  homePage: [
    async ({ page }, use) => {
      await page.route(`**${SOKNADER_API_PATH}`, async (route) => {
        await route.fulfill({ json: seedSoknaderResponse });
      });
      await page.route(`**${SAKER_API_PATH}/*`, async (route) => {
        const id = new URL(route.request().url()).pathname.split('/').at(-1) ?? '';
        const sak = getSeedSakResponseById(id);

        if (!sak) {
          await route.fulfill({
            status: 404,
            json: { detail: 'Saken finnes ikke' },
          });
          return;
        }

        await route.fulfill({ json: sak });
      });
      await page.route(`**${VEDTAK_API_PATH}`, async (route) => {
        const body = route.request().postDataJSON() as { soknadId?: string };
        const soknadId = body.soknadId ?? '';
        const sakId = getSeedSakIdForSoknad(soknadId);
        const sak = getSeedSakResponseById(String(sakId));
        await route.fulfill({
          status: 201,
          json: {
            sakId,
            soknadId,
            status: sak?.status ?? 'FERDIGSTILT',
            vedtaksvariant: sak?.vedtak?.variant ?? 'MANUELL_VURDERING',
            regelspor: sak?.regelspor ?? [],
            vedtak: sak?.vedtak ?? null,
            manuellVurdering: sak?.manuellVurdering ?? null,
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
