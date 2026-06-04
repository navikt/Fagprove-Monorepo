import type { APIRoute } from 'astro';
import {
  BackendError,
  createBackendErrorResponse,
  fetchFromBackend,
} from '../../../../lib/backend-client';
import type { SoknadListeResponse } from '../../../../lib/foreldrepenger';
import { SOKNADER_API_PATH } from '../../../../lib/foreldrepenger';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const response = await fetchFromBackend<SoknadListeResponse>(SOKNADER_API_PATH);
    return Response.json(response);
  } catch (error) {
    if (error instanceof BackendError) {
      return createBackendErrorResponse(error);
    }

    console.error('Kunne ikke hente søknader fra backend', error);
    return Response.json({ error: 'Kunne ikke hente søknader fra backend' }, { status: 500 });
  }
};
