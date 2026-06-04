import type { HttpHandler } from 'msw';
import { http, HttpResponse } from 'msw';
import { SAKER_API_PATH, SOKNADER_API_PATH, VEDTAK_API_PATH } from '../lib/foreldrepenger';
import {
  getSeedSakIdForSoknad,
  getSeedSakResponseById,
  seedSoknaderResponse,
} from './foreldrepenger-seed';

export const handlers: HttpHandler[] = [
  http.get(SOKNADER_API_PATH, () => HttpResponse.json(seedSoknaderResponse)),
  http.get(`${SAKER_API_PATH}/:id`, ({ params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const sak = typeof id === 'string' ? getSeedSakResponseById(id) : undefined;

    if (!sak) {
      return HttpResponse.json({ detail: 'Saken finnes ikke' }, { status: 404 });
    }

    return HttpResponse.json(sak);
  }),
  http.post(VEDTAK_API_PATH, async ({ request }) => {
    const body = (await request.json()) as { soknadId?: unknown };
    const soknadId = typeof body.soknadId === 'string' ? body.soknadId : '';
    const sakId = getSeedSakIdForSoknad(soknadId);
    const sak = getSeedSakResponseById(String(sakId));

    return HttpResponse.json(
      {
        sakId,
        soknadId,
        status: sak?.status ?? 'FERDIGSTILT',
        vedtaksvariant: sak?.vedtak?.variant ?? 'MANUELL_VURDERING',
        regelspor: sak?.regelspor ?? [],
        vedtak: sak?.vedtak ?? null,
        manuellVurdering: sak?.manuellVurdering ?? null,
      },
      { status: 201 },
    );
  }),
];
