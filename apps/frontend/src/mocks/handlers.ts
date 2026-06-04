import type { HttpHandler } from 'msw';
import { http, HttpResponse } from 'msw';
import { SOKNADER_API_PATH, VEDTAK_API_PATH } from '../lib/foreldrepenger';
import { seedSoknaderResponse } from './foreldrepenger-seed';

export const handlers: HttpHandler[] = [
  http.get(SOKNADER_API_PATH, () => HttpResponse.json(seedSoknaderResponse)),
  http.post(VEDTAK_API_PATH, async ({ request }) => {
    const body = (await request.json()) as { soknadId?: unknown };
    const soknadId = typeof body.soknadId === 'string' ? body.soknadId : '';

    return HttpResponse.json(
      {
        sakId: 1001,
        soknadId,
        status: 'FERDIGSTILT',
        vedtaksvariant: 'INNVILGET',
        regelspor: [],
      },
      { status: 201 },
    );
  }),
];
