import type { HttpHandler } from 'msw';
import { http, HttpResponse } from 'msw';
import {
  SAKER_API_PATH,
  SOKNADER_API_PATH,
  VEDTAK_API_PATH,
  type ManuellBeslutningType,
  type SakResponse,
} from '../lib/foreldrepenger';
import {
  createManualDecisionSakResponse,
  getSeedSakIdForSoknad,
  getSeedSakResponseById,
  seedSoknaderResponse,
} from './foreldrepenger-seed';

const manualDecisionSakResponses = new Map<string, SakResponse>();

export function resetManualDecisionMocks() {
  manualDecisionSakResponses.clear();
}

function isManuellBeslutningType(value: unknown): value is ManuellBeslutningType {
  return value === 'INNVILGELSE' || value === 'AVSLAG';
}

export const handlers: HttpHandler[] = [
  http.get(SOKNADER_API_PATH, () => HttpResponse.json(seedSoknaderResponse)),
  http.get(`${SAKER_API_PATH}/:id`, ({ params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const sak =
      typeof id === 'string'
        ? (manualDecisionSakResponses.get(id) ?? getSeedSakResponseById(id))
        : undefined;

    if (!sak) {
      return HttpResponse.json({ detail: 'Saken finnes ikke' }, { status: 404 });
    }

    return HttpResponse.json(sak);
  }),
  http.post(`${SAKER_API_PATH}/:id/beslutning`, async ({ params, request }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const sak = typeof id === 'string' ? getSeedSakResponseById(id) : undefined;

    if (!id || !sak) {
      return HttpResponse.json({ detail: 'Saken finnes ikke' }, { status: 404 });
    }
    if (sak.status !== 'TIL_MANUELL_VURDERING' || sak.vedtak) {
      return HttpResponse.json(
        { detail: 'Saken venter ikke på manuell beslutning' },
        { status: 409 },
      );
    }

    const body = (await request.json()) as {
      type?: unknown;
      begrunnelse?: unknown;
      besluttetAv?: unknown;
    };
    const type = body.type;
    const begrunnelse = typeof body.begrunnelse === 'string' ? body.begrunnelse.trim() : '';
    const besluttetAv = typeof body.besluttetAv === 'string' ? body.besluttetAv.trim() : '';

    if (!isManuellBeslutningType(type) || !begrunnelse || !besluttetAv) {
      return HttpResponse.json(
        { detail: 'Manuell beslutning inneholder ugyldige verdier' },
        { status: 400 },
      );
    }

    const updatedSak = createManualDecisionSakResponse(type, begrunnelse, besluttetAv);
    manualDecisionSakResponses.set(id, updatedSak);
    return HttpResponse.json(updatedSak);
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
