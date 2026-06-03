import type { APIRoute } from 'astro';
import {
  fetchFromBackend,
  BackendError,
  createBackendErrorResponse,
} from '../../lib/backend-client';

interface User {
  id: number;
  name: string;
  age: number;
}

export const GET: APIRoute = async () => {
  try {
    const users = await fetchFromBackend<User[]>('/users');
    return Response.json(users);
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
    const id = await fetchFromBackend<number>('/users', {
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
