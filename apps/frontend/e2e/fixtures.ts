import { test as base, expect } from '@playwright/test';
import {
  SAKER_API_PATH,
  SOKNADER_API_PATH,
  VEDTAK_API_PATH,
  type ManuellBeslutningType,
  type SakResponse,
} from '../src/lib/foreldrepenger';
import {
  createManualDecisionSakResponse,
  getSeedSakIdForSoknad,
  getSeedSakResponseById,
  seedSoknaderResponse,
} from '../src/mocks/foreldrepenger-seed';

/** Extends the base test with a loaded home page before each test. */
export const test = base.extend<{ homePage: boolean }>({
  homePage: [
    async ({ page }, use) => {
      const manualDecisionSakResponses = new Map<string, SakResponse>();

      await page.route(`**${SOKNADER_API_PATH}`, async (route) => {
        await route.fulfill({ json: seedSoknaderResponse });
      });
      await page.route(`**${SAKER_API_PATH}/*`, async (route) => {
        if (route.request().method() !== 'GET') {
          await route.fallback();
          return;
        }

        const id = new URL(route.request().url()).pathname.split('/').at(-1) ?? '';
        const sak = manualDecisionSakResponses.get(id) ?? getSeedSakResponseById(id);

        if (!sak) {
          await route.fulfill({
            status: 404,
            json: { detail: 'Saken finnes ikke' },
          });
          return;
        }

        await route.fulfill({ json: sak });
      });
      await page.route(`**${SAKER_API_PATH}/*/beslutning`, async (route) => {
        const request = route.request();
        if (request.method() !== 'POST') {
          await route.fallback();
          return;
        }

        const pathParts = new URL(request.url()).pathname.split('/');
        const id = pathParts.at(-2) ?? '';
        const sak = getSeedSakResponseById(id);
        if (!sak) {
          await route.fulfill({
            status: 404,
            json: { detail: 'Saken finnes ikke' },
          });
          return;
        }

        const body = request.postDataJSON() as {
          type?: unknown;
          begrunnelse?: unknown;
          besluttetAv?: unknown;
        };
        const type = body.type;
        const begrunnelse = typeof body.begrunnelse === 'string' ? body.begrunnelse.trim() : '';
        const besluttetAv = typeof body.besluttetAv === 'string' ? body.besluttetAv.trim() : '';

        if (!isManuellBeslutningType(type) || !begrunnelse || !besluttetAv) {
          await route.fulfill({
            status: 400,
            json: { detail: 'Manuell beslutning inneholder ugyldige verdier' },
          });
          return;
        }

        const updatedSak = createManualDecisionSakResponse(type, begrunnelse, besluttetAv);
        manualDecisionSakResponses.set(id, updatedSak);
        await route.fulfill({ json: updatedSak });
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

function isManuellBeslutningType(value: unknown): value is ManuellBeslutningType {
  return value === 'INNVILGELSE' || value === 'AVSLAG';
}
