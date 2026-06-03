import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './users';

const originalBackendUrl = process.env.BACKEND_URL;

function apiContext(request?: Request): Parameters<typeof GET>[0] {
  return (request ? { request } : {}) as Parameters<typeof GET>[0];
}

describe('/api/users', () => {
  beforeEach(() => {
    process.env.BACKEND_URL = 'http://backend';
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalBackendUrl === undefined) {
      delete process.env.BACKEND_URL;
    } else {
      process.env.BACKEND_URL = originalBackendUrl;
    }
  });

  it('should proxy GET /users from backend', async () => {
    const users = [{ id: 1, name: 'Kari', age: 25 }];
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(users), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const response = await GET(apiContext());

    await expect(response.json()).resolves.toEqual(users);
    expect(fetch).toHaveBeenCalledWith('http://backend/users', expect.anything());
  });

  it('should preserve backend error body from GET /users', async () => {
    const problem = {
      title: 'Bad Request',
      status: 400,
      detail: 'Could not list users',
    };
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(problem), {
        status: 400,
        statusText: 'Bad Request',
        headers: { 'Content-Type': 'application/problem+json' },
      }),
    );

    const response = await GET(apiContext());

    expect(response.status).toBe(400);
    expect(response.headers.get('Content-Type')).toBe('application/problem+json');
    await expect(response.json()).resolves.toEqual(problem);
  });

  it('should proxy POST /users to backend', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(1), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ name: 'Kari', age: 25 }),
    });

    const response = await POST(apiContext(request));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toBe(1);
    expect(fetch).toHaveBeenCalledWith(
      'http://backend/users',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Kari', age: 25 }),
      }),
    );
  });
});
