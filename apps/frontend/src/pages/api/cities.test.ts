import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './cities';

const originalBackendUrl = process.env.BACKEND_URL;

function apiContext(request?: Request): Parameters<typeof GET>[0] {
  return (request ? { request } : {}) as Parameters<typeof GET>[0];
}

describe('/api/cities', () => {
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

  it('should proxy GET /cities from backend', async () => {
    const cities = [{ id: 1, name: 'Oslo', population: 700000 }];
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(cities), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const response = await GET(apiContext());

    await expect(response.json()).resolves.toEqual(cities);
    expect(fetch).toHaveBeenCalledWith('http://backend/cities', expect.anything());
  });

  it('should preserve backend error body from GET /cities', async () => {
    const problem = {
      title: 'Bad Request',
      status: 400,
      detail: 'Could not list cities',
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

  it('should preserve backend error body from POST /cities', async () => {
    const problem = {
      title: 'Bad Request',
      status: 400,
      detail: 'population must be greater than zero',
    };
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(problem), {
        status: 400,
        statusText: 'Bad Request',
        headers: { 'Content-Type': 'application/problem+json' },
      }),
    );
    const request = new Request('http://localhost/api/cities', {
      method: 'POST',
      body: JSON.stringify({ name: 'Oslo', population: -1 }),
    });

    const response = await POST(apiContext(request));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual(problem);
  });
});
