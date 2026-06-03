import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchFromBackend } from './backend-client';

describe('backend-client', () => {
  const originalEnv = import.meta.env.BACKEND_URL;
  const originalProcessEnv = process.env.BACKEND_URL;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    delete process.env.BACKEND_URL;
    import.meta.env.BACKEND_URL = 'http://localhost:8080';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    import.meta.env.BACKEND_URL = originalEnv;
    if (originalProcessEnv === undefined) {
      delete process.env.BACKEND_URL;
    } else {
      process.env.BACKEND_URL = originalProcessEnv;
    }
  });

  it('should fetch data from backend successfully', async () => {
    const mockData = { message: 'Hello from Ktor backend!' };
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(mockData), { status: 200 }));

    const result = await fetchFromBackend('/hello');

    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/hello',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }),
      }),
    );
  });

  it('should throw BackendError with text body on non-OK response', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('Not Found', { status: 404, statusText: 'Not Found' }),
    );

    await expect(fetchFromBackend('/missing')).rejects.toMatchObject({
      name: 'BackendError',
      status: 404,
      body: 'Not Found',
      message: 'Backend returned 404: Not Found',
    });
  });

  it('should preserve JSON error body from backend', async () => {
    const problem = {
      title: 'Bad Request',
      status: 400,
      detail: 'name must not be blank',
      errors: ['name must not be blank'],
    };
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(problem), {
        status: 400,
        statusText: 'Bad Request',
        headers: { 'Content-Type': 'application/problem+json' },
      }),
    );

    await expect(fetchFromBackend('/users')).rejects.toMatchObject({
      name: 'BackendError',
      status: 400,
      body: problem,
      message: 'Backend returned 400: name must not be blank',
    });
  });

  it('should throw BackendError with status 503 when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Connection refused'));

    await expect(fetchFromBackend('/hello')).rejects.toMatchObject({
      name: 'BackendError',
      status: 503,
    });
  });

  it('should throw BackendError when BACKEND_URL is not set', async () => {
    import.meta.env.BACKEND_URL = '';

    await expect(fetchFromBackend('/hello')).rejects.toThrow('BACKEND_URL is not configured');
  });

  it('should strip trailing slash from BACKEND_URL', async () => {
    import.meta.env.BACKEND_URL = 'http://localhost:8080/';
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

    await fetchFromBackend('/hello');

    expect(fetch).toHaveBeenCalledWith('http://localhost:8080/hello', expect.anything());
  });

  it('should prefer runtime process env for deployed SSR', async () => {
    process.env.BACKEND_URL = 'http://nais-backend';
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

    await fetchFromBackend('/hello');

    expect(fetch).toHaveBeenCalledWith('http://nais-backend/hello', expect.anything());
  });
});
