import type { HttpHandler } from 'msw';
import { http, HttpResponse } from 'msw';
import {
  DEMO_RESET_API_PATH,
  INTERNE_MERKNADER_API_PATH,
  SAKER_API_PATH,
  SOKNADER_API_PATH,
  VEDTAK_API_PATH,
  type InternMerknad,
  type ManuellBeslutningType,
  type SakResponse,
} from '../lib/foreldrepenger';
import {
  createManualDecisionSakResponse,
  emptyInternMerknad,
  getSeedSakIdForSoknad,
  getSeedSakResponseById,
  seedInterneMerknader,
  seedInternMerknadOversikt,
  seedSoknaderResponse,
} from './foreldrepenger-seed';

const manualDecisionSakResponses = new Map<string, SakResponse>();
const internMerknader = new Map<string, InternMerknad>();

export function resetMockState() {
  manualDecisionSakResponses.clear();
  internMerknader.clear();
}

function getInternMerknad(id: string): InternMerknad {
  return internMerknader.get(id) ?? seedInterneMerknader[id] ?? emptyInternMerknad(Number(id));
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
  http.get(INTERNE_MERKNADER_API_PATH, () =>
    HttpResponse.json({ saker: seedInternMerknadOversikt }),
  ),
  http.get(`${SAKER_API_PATH}/:id/intern-merknad`, ({ params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    if (typeof id !== 'string') {
      return HttpResponse.json({ detail: 'Saken finnes ikke' }, { status: 404 });
    }
    return HttpResponse.json(getInternMerknad(id));
  }),
  http.put(`${SAKER_API_PATH}/:id/intern-merknad`, async ({ params, request }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    if (typeof id !== 'string') {
      return HttpResponse.json({ detail: 'Saken finnes ikke' }, { status: 404 });
    }

    const body = (await request.json()) as {
      komplisert?: unknown;
      kommentar?: unknown;
      oppdatertAv?: unknown;
    };
    const komplisert = body.komplisert;
    const kommentar = typeof body.kommentar === 'string' ? body.kommentar : null;
    const oppdatertAv = typeof body.oppdatertAv === 'string' ? body.oppdatertAv.trim() : '';

    if (typeof komplisert !== 'boolean' || kommentar === null || !oppdatertAv) {
      return HttpResponse.json(
        { detail: 'Intern merknad inneholder ugyldige verdier' },
        { status: 400 },
      );
    }
    if (komplisert && !kommentar.trim()) {
      return HttpResponse.json(
        { detail: 'kommentar må fylles ut når saken markeres som komplisert' },
        { status: 400 },
      );
    }

    const lagret: InternMerknad = {
      sakId: Number(id),
      komplisert,
      kommentar: kommentar.trim(),
      oppdatertAv,
      oppdatertTidspunkt: '2026-06-05T09:30:00Z',
    };
    internMerknader.set(id, lagret);
    return HttpResponse.json(lagret);
  }),
  http.post(DEMO_RESET_API_PATH, () =>
    HttpResponse.json({ antallSoknader: seedSoknaderResponse.soknader.length }),
  ),
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
