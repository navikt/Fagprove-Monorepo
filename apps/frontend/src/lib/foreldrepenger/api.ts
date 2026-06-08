import { ApiClientError, fetchJson, isRecord } from './client';
import type {
  BehandlingResultatResponse,
  DemoResetResponse,
  InterneMerknaderResponse,
  InternMerknad,
  InternMerknadOversikt,
  InternMerknadRequest,
  ManuellBeslutningRequest,
  SakResponse,
  SoknadListeDto,
  SoknadListeResponse,
  StartBehandlingRequest,
} from './types';

export const SOKNADER_API_PATH = '/api/v1/foreldrepenger/soknader';
export const SAKER_API_PATH = '/api/v1/foreldrepenger/saker';
export const VEDTAK_API_PATH = '/api/v1/foreldrepenger/vedtak';
export const DEMO_RESET_API_PATH = '/api/v1/foreldrepenger/demo/reset';
export const INTERNE_MERKNADER_API_PATH = '/api/v1/foreldrepenger/interne-merknader';

export const DEMO_OPPDATERT_AV = 'Kari Saksbehandler';

export function sakApiPath(sakId: string | number): string {
  return `${SAKER_API_PATH}/${encodeURIComponent(String(sakId).trim())}`;
}

export function manuellBeslutningApiPath(sakId: string | number): string {
  return `${sakApiPath(sakId)}/beslutning`;
}

export function internMerknadApiPath(sakId: string | number): string {
  return `${sakApiPath(sakId)}/intern-merknad`;
}

export async function hentSoknader(): Promise<SoknadListeDto[]> {
  const response = await fetchJson<SoknadListeResponse>(SOKNADER_API_PATH);
  if (!Array.isArray(response.soknader)) {
    throw new ApiClientError('Frontend-API-et returnerte en uventet søknadsliste', 502);
  }
  return response.soknader;
}

export async function hentSak(sakId: string | number): Promise<SakResponse> {
  const response = await fetchJson<SakResponse>(sakApiPath(sakId));
  if (
    typeof response.sakId !== 'number' ||
    typeof response.soknad?.id !== 'string' ||
    !Array.isArray(response.regelspor)
  ) {
    throw new ApiClientError('Frontend-API-et returnerte en uventet sakrespons', 502);
  }

  return response;
}

export async function besluttManuelt(
  sakId: string | number,
  request: ManuellBeslutningRequest,
): Promise<SakResponse> {
  const response = await fetchJson<SakResponse>(manuellBeslutningApiPath(sakId), {
    method: 'POST',
    body: JSON.stringify({
      type: request.type,
      begrunnelse: request.begrunnelse.trim(),
      besluttetAv: request.besluttetAv.trim(),
    } satisfies ManuellBeslutningRequest),
  });

  if (
    typeof response.sakId !== 'number' ||
    typeof response.soknad?.id !== 'string' ||
    !Array.isArray(response.regelspor)
  ) {
    throw new ApiClientError('Frontend-API-et returnerte en uventet sakrespons', 502);
  }

  return response;
}

export async function startBehandling(soknadId: string): Promise<BehandlingResultatResponse> {
  const response = await fetchJson<BehandlingResultatResponse>(VEDTAK_API_PATH, {
    method: 'POST',
    body: JSON.stringify({ soknadId } satisfies StartBehandlingRequest),
  });

  if (typeof response.sakId !== 'number') {
    throw new ApiClientError('Frontend-API-et returnerte en uventet sakrespons', 502);
  }

  return response;
}

function isInternMerknad(value: unknown): value is InternMerknad {
  return (
    isRecord(value) &&
    typeof value.sakId === 'number' &&
    typeof value.komplisert === 'boolean' &&
    typeof value.kommentar === 'string'
  );
}

function isInternMerknadOversikt(value: unknown): value is InternMerknadOversikt {
  return (
    isRecord(value) &&
    typeof value.sakId === 'number' &&
    typeof value.saksnummer === 'string' &&
    typeof value.sokerIdent === 'string' &&
    typeof value.komplisert === 'boolean' &&
    typeof value.kommentar === 'string' &&
    typeof value.oppdatertAv === 'string' &&
    typeof value.oppdatertTidspunkt === 'string'
  );
}

export async function hentInternMerknad(sakId: string | number): Promise<InternMerknad> {
  const response = await fetchJson<InternMerknad>(internMerknadApiPath(sakId));
  if (!isInternMerknad(response)) {
    throw new ApiClientError('Frontend-API-et returnerte en uventet intern merknad', 502);
  }
  return response;
}

export async function lagreInternMerknad(
  sakId: string | number,
  request: InternMerknadRequest,
): Promise<InternMerknad> {
  const response = await fetchJson<InternMerknad>(internMerknadApiPath(sakId), {
    method: 'PUT',
    body: JSON.stringify({
      komplisert: request.komplisert,
      kommentar: request.kommentar.trim(),
      oppdatertAv: request.oppdatertAv.trim(),
    } satisfies InternMerknadRequest),
  });

  if (!isInternMerknad(response)) {
    throw new ApiClientError('Frontend-API-et returnerte en uventet intern merknad', 502);
  }
  return response;
}

export async function listInterneMerknader(): Promise<InternMerknadOversikt[]> {
  const response = await fetchJson<InterneMerknaderResponse>(INTERNE_MERKNADER_API_PATH);
  if (!Array.isArray(response.saker) || !response.saker.every(isInternMerknadOversikt)) {
    throw new ApiClientError('Frontend-API-et returnerte en uventet merknadsoversikt', 502);
  }
  return response.saker;
}

export async function tilbakestillDemodata(): Promise<DemoResetResponse> {
  const response = await fetchJson<DemoResetResponse>(DEMO_RESET_API_PATH, {
    method: 'POST',
  });

  if (typeof response.antallSoknader !== 'number') {
    throw new ApiClientError('Frontend-API-et returnerte et uventet svar på nullstilling', 502);
  }

  return response;
}
