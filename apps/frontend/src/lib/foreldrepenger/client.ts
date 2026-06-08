export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readErrorMessage(body: unknown): string | undefined {
  if (typeof body === 'string' && body.trim()) {
    return body;
  }
  if (!isRecord(body)) {
    return undefined;
  }
  for (const key of ['detail', 'error', 'title']) {
    const value = body[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return undefined;
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return text;
    }
    throw error;
  }
}

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;
const recentCallTimestamps: number[] = [];

export function _resetRateLimitForTests(): void {
  recentCallTimestamps.length = 0;
}

export function checkRateLimit(): void {
  const now = Date.now();
  while (recentCallTimestamps.length > 0 && recentCallTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
    recentCallTimestamps.shift();
  }
  if (recentCallTimestamps.length >= RATE_LIMIT_MAX) {
    throw new ApiClientError('For mange forespørsler. Vent litt og prøv igjen.', 429);
  }
  recentCallTimestamps.push(now);
}

export async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  checkRateLimit();
  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options?.headers,
      },
    });
  } catch (error) {
    throw new ApiClientError(
      `Klarte ikke å kontakte frontend-API-et: ${
        error instanceof Error ? error.message : 'Ukjent feil'
      }`,
    );
  }

  const body = await readResponseBody(response);
  if (!response.ok) {
    throw new ApiClientError(
      readErrorMessage(body) ?? `Frontend-API-et svarte med status ${response.status}`,
      response.status,
    );
  }

  return body as T;
}
