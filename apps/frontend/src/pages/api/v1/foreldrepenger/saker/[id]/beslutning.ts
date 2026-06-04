import type { APIRoute } from 'astro';
import {
  BackendError,
  createBackendErrorResponse,
  fetchFromBackend,
} from '../../../../../../lib/backend-client';
import type {
  ManuellBeslutningRequest,
  ManuellBeslutningType,
  SakResponse,
} from '../../../../../../lib/foreldrepenger';
import { manuellBeslutningApiPath } from '../../../../../../lib/foreldrepenger';

export const prerender = false;

const MANUELLE_BESLUTNING_TYPER: ManuellBeslutningType[] = ['INNVILGELSE', 'AVSLAG'];

function isValidSakId(value: string | undefined): value is string {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value);
}

function isManuellBeslutningType(value: unknown): value is ManuellBeslutningType {
  return (
    typeof value === 'string' && MANUELLE_BESLUTNING_TYPER.includes(value as ManuellBeslutningType)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validerRequestBody(value: unknown): ManuellBeslutningRequest | Response {
  if (!isRecord(value)) {
    return Response.json({ error: 'Forespørselen må være et JSON-objekt' }, { status: 400 });
  }

  if (!isManuellBeslutningType(value.type)) {
    return Response.json({ error: 'type må være INNVILGELSE eller AVSLAG' }, { status: 400 });
  }

  const begrunnelse = typeof value.begrunnelse === 'string' ? value.begrunnelse.trim() : '';
  if (!begrunnelse) {
    return Response.json({ error: 'begrunnelse må fylles ut' }, { status: 400 });
  }

  const besluttetAv = typeof value.besluttetAv === 'string' ? value.besluttetAv.trim() : '';
  if (!besluttetAv) {
    return Response.json({ error: 'besluttetAv må fylles ut' }, { status: 400 });
  }

  return {
    type: value.type,
    begrunnelse,
    besluttetAv,
  };
}

export const POST: APIRoute = async ({ params, request }) => {
  const sakId = params.id;
  if (!isValidSakId(sakId)) {
    return Response.json({ error: 'Sak id må være et positivt heltall' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Ugyldig JSON i forespørselen' }, { status: 400 });
  }

  const validatedRequest = validerRequestBody(body);
  if (validatedRequest instanceof Response) {
    return validatedRequest;
  }

  try {
    const response = await fetchFromBackend<SakResponse>(manuellBeslutningApiPath(sakId), {
      method: 'POST',
      body: JSON.stringify(validatedRequest),
    });
    return Response.json(response);
  } catch (error) {
    if (error instanceof BackendError) {
      return createBackendErrorResponse(error);
    }

    console.error('Kunne ikke lagre manuell beslutning i backend', error);
    return Response.json(
      { error: 'Kunne ikke lagre manuell beslutning i backend' },
      { status: 500 },
    );
  }
};
