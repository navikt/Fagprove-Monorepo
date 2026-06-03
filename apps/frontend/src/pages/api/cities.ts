import type { APIRoute } from 'astro';
import {
  fetchFromBackend,
  BackendError,
  createBackendErrorResponse,
} from '../../lib/backend-client';

interface City {
  id: number;
  name: string;
  population: number;
}

export const GET: APIRoute = async () => {
  try {
    const cities = await fetchFromBackend<City[]>('/cities');
    return Response.json(cities);
  } catch (error) {
    if (error instanceof BackendError) {
      return createBackendErrorResponse(error);
    }

    return Response.json({ error: 'Kunne ikke nå backend' }, { status: 502 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Ugyldig JSON i forespørselen' }, { status: 400 });
  }

  try {
    const id = await fetchFromBackend<number>('/cities', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return Response.json(id, { status: 201 });
  } catch (error) {
    if (error instanceof BackendError) {
      return createBackendErrorResponse(error);
    }

    return Response.json({ error: 'Kunne ikke nå backend' }, { status: 502 });
  }
};
