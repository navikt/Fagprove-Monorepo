/**
 * Server-side backend client for the BFF layer.
 * Calls the Ktor backend via BACKEND_URL environment variable.
 * Only use in Astro API routes / SSR — never in client-side code.
 */

const TIMEOUT_MS = 5_000;

function getBackendUrl(): string {
  const url = process.env.BACKEND_URL ?? import.meta.env.BACKEND_URL;
  if (!url) {
    throw new Error('BACKEND_URL is not configured. Set it as an environment variable.');
  }
  return url.replace(/\/$/, '');
}

export class BackendError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: unknown,
    public readonly rawBody?: string,
    public readonly contentType?: string,
  ) {
    super(message);
    this.name = 'BackendError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readErrorMessage(body: unknown): string | undefined {
  if (typeof body === 'string' && body.trim()) {
    return body;
  }
  if (!isRecord(body)) {
    return undefined;
  }
  if (typeof body.detail === 'string' && body.detail.trim()) {
    return body.detail;
  }
  if (typeof body.error === 'string' && body.error.trim()) {
    return body.error;
  }
  if (typeof body.title === 'string' && body.title.trim()) {
    return body.title;
  }
  return undefined;
}

interface BackendResponseBody {
  body: unknown;
  rawBody?: string;
  contentType?: string;
}

async function readResponseBody(response: Response): Promise<BackendResponseBody> {
  const text = await response.text();
  if (!text.trim()) {
    return {
      body: undefined,
      contentType: response.headers.get('Content-Type') ?? undefined,
    };
  }

  try {
    return {
      body: JSON.parse(text) as unknown,
      rawBody: text,
      contentType: response.headers.get('Content-Type') ?? undefined,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        body: text,
        rawBody: text,
        contentType: response.headers.get('Content-Type') ?? undefined,
      };
    }
    throw error;
  }
}

export function getBackendErrorBody(error: BackendError): unknown {
  if (isRecord(error.body) || Array.isArray(error.body)) {
    return error.body;
  }
  if (typeof error.body === 'string' && error.body.trim()) {
    return { error: error.body };
  }
  return { error: error.message };
}

export function createBackendErrorResponse(error: BackendError): Response {
  const status = error.status ?? 502;
  if (error.rawBody !== undefined) {
    const headers = error.contentType ? { 'Content-Type': error.contentType } : undefined;
    return new Response(error.rawBody, { status, headers });
  }

  return Response.json(getBackendErrorBody(error), { status });
}

export async function fetchFromBackend<T>(path: string, options?: RequestInit): Promise<T> {
  const backendUrl = getBackendUrl();
  const url = `${backendUrl}${path}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const { body, rawBody, contentType } = await readResponseBody(response);
      const backendMessage =
        readErrorMessage(body) ?? (response.statusText || 'Unknown backend error');
      throw new BackendError(
        `Backend returned ${response.status}: ${backendMessage}`,
        response.status,
        body,
        rawBody,
        contentType,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof BackendError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new BackendError('Backend request timed out', 504);
    }
    throw new BackendError(
      `Failed to reach backend: ${error instanceof Error ? error.message : 'Unknown error'}`,
      503,
    );
  } finally {
    clearTimeout(timeout);
  }
}
