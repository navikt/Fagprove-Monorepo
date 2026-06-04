import type { APIRoute } from 'astro';
import {
  BackendError,
  createBackendErrorResponse,
  fetchFromBackend,
} from '../../../../../lib/backend-client';
import type { SakResponse } from '../../../../../lib/foreldrepenger';
import { sakApiPath } from '../../../../../lib/foreldrepenger';

export const prerender = false;

function isValidSakId(value: string | undefined): value is string {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value);
}

export const GET: APIRoute = async ({ params }) => {
  const sakId = params.id;
  if (!isValidSakId(sakId)) {
    return Response.json({ error: 'Sak id må være et positivt heltall' }, { status: 400 });
  }

  try {
    const response = await fetchFromBackend<SakResponse>(sakApiPath(sakId));
    return Response.json(response);
  } catch (error) {
    if (error instanceof BackendError) {
      return createBackendErrorResponse(error);
    }

    console.error('Kunne ikke hente sak fra backend', error);
    return Response.json({ error: 'Kunne ikke hente sak fra backend' }, { status: 500 });
  }
};
