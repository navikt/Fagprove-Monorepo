import type { APIRoute } from 'astro';
import {
  BackendError,
  createBackendErrorResponse,
  fetchFromBackend,
} from '../../../../../lib/backend-client';
import type { DemoResetResponse } from '../../../../../lib/foreldrepenger';
import { DEMO_RESET_API_PATH } from '../../../../../lib/foreldrepenger';

export const prerender = false;

export const POST: APIRoute = async () => {
  try {
    const response = await fetchFromBackend<DemoResetResponse>(DEMO_RESET_API_PATH, {
      method: 'POST',
    });
    return Response.json(response);
  } catch (error) {
    if (error instanceof BackendError) {
      return createBackendErrorResponse(error);
    }

    console.error('Kunne ikke tilbakestille demodata i backend', error);
    return Response.json({ error: 'Kunne ikke tilbakestille demodata i backend' }, { status: 500 });
  }
};
