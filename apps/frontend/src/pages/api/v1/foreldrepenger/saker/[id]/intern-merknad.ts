import type { APIRoute } from 'astro';
import {
  BackendError,
  createBackendErrorResponse,
  fetchFromBackend,
} from '../../../../../../lib/backend-client';
import type { InternMerknad, InternMerknadRequest } from '../../../../../../lib/foreldrepenger';
import { internMerknadApiPath } from '../../../../../../lib/foreldrepenger';

export const prerender = false;

function isValidSakId(value: string | undefined): value is string {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validerRequestBody(value: unknown): InternMerknadRequest | Response {
  if (!isRecord(value)) {
    return Response.json({ error: 'Forespørselen må være et JSON-objekt' }, { status: 400 });
  }

  if (typeof value.komplisert !== 'boolean') {
    return Response.json({ error: 'komplisert må være true eller false' }, { status: 400 });
  }

  if (typeof value.kommentar !== 'string') {
    return Response.json({ error: 'kommentar må være med' }, { status: 400 });
  }

  const oppdatertAv = typeof value.oppdatertAv === 'string' ? value.oppdatertAv.trim() : '';
  if (!oppdatertAv) {
    return Response.json({ error: 'oppdatertAv må fylles ut' }, { status: 400 });
  }

  return {
    komplisert: value.komplisert,
    kommentar: value.kommentar,
    oppdatertAv,
  };
}

export const GET: APIRoute = async ({ params }) => {
  const sakId = params.id;
  if (!isValidSakId(sakId)) {
    return Response.json({ error: 'Sak id må være et positivt heltall' }, { status: 400 });
  }

  try {
    const response = await fetchFromBackend<InternMerknad>(internMerknadApiPath(sakId));
    return Response.json(response);
  } catch (error) {
    if (error instanceof BackendError) {
      return createBackendErrorResponse(error);
    }

    console.error('Kunne ikke hente intern merknad fra backend', error);
    return Response.json({ error: 'Kunne ikke hente intern merknad fra backend' }, { status: 500 });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
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
    const response = await fetchFromBackend<InternMerknad>(internMerknadApiPath(sakId), {
      method: 'PUT',
      body: JSON.stringify(validatedRequest),
    });
    return Response.json(response);
  } catch (error) {
    if (error instanceof BackendError) {
      return createBackendErrorResponse(error);
    }

    console.error('Kunne ikke lagre intern merknad i backend', error);
    return Response.json({ error: 'Kunne ikke lagre intern merknad i backend' }, { status: 500 });
  }
};
