import type { APIRoute } from 'astro';
import {
  BackendError,
  createBackendErrorResponse,
  fetchFromBackend,
} from '../../../../lib/backend-client';
import type { InterneMerknaderResponse } from '../../../../lib/foreldrepenger';
import { INTERNE_MERKNADER_API_PATH } from '../../../../lib/foreldrepenger';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const response = await fetchFromBackend<InterneMerknaderResponse>(INTERNE_MERKNADER_API_PATH);
    return Response.json(response);
  } catch (error) {
    if (error instanceof BackendError) {
      return createBackendErrorResponse(error);
    }

    console.error('Kunne ikke hente interne merknader fra backend', error);
    return Response.json(
      { error: 'Kunne ikke hente interne merknader fra backend' },
      { status: 500 },
    );
  }
};
