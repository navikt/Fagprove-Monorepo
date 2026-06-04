import type { APIRoute } from 'astro';
import {
  BackendError,
  createBackendErrorResponse,
  fetchFromBackend,
} from '../../../../lib/backend-client';
import type {
  BehandlingResultatResponse,
  StartBehandlingRequest,
} from '../../../../lib/foreldrepenger';
import { VEDTAK_API_PATH } from '../../../../lib/foreldrepenger';

export const prerender = false;

function isStartBehandlingRequest(value: unknown): value is StartBehandlingRequest {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { soknadId?: unknown }).soknadId === 'string' &&
    (value as { soknadId: string }).soknadId.trim().length > 0
  );
}

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Ugyldig JSON i forespørselen' }, { status: 400 });
  }

  if (!isStartBehandlingRequest(body)) {
    return Response.json({ error: 'soknadId må fylles ut' }, { status: 400 });
  }

  try {
    const response = await fetchFromBackend<BehandlingResultatResponse>(VEDTAK_API_PATH, {
      method: 'POST',
      body: JSON.stringify({ soknadId: body.soknadId.trim() } satisfies StartBehandlingRequest),
    });
    return Response.json(response);
  } catch (error) {
    if (error instanceof BackendError) {
      return createBackendErrorResponse(error);
    }

    console.error('Kunne ikke starte behandling i backend', error);
    return Response.json({ error: 'Kunne ikke starte behandling i backend' }, { status: 500 });
  }
};
