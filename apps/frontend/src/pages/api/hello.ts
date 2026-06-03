import type { APIRoute } from 'astro';
import { fetchFromBackend, BackendError } from '../../lib/backend-client';

interface HelloResponse {
  message: string;
}

export const GET: APIRoute = async () => {
  try {
    const data = await fetchFromBackend<HelloResponse>('/hello');
    return Response.json(data);
  } catch (error) {
    const status = error instanceof BackendError ? (error.status ?? 502) : 502;
    const message = error instanceof BackendError ? error.message : 'Kunne ikke nå backend';

    return Response.json({ message, error: true }, { status });
  }
};
