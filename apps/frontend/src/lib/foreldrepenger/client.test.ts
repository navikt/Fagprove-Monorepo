import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { checkRateLimit, _resetRateLimitForTests, ApiClientError } from './client';

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    _resetRateLimitForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('tillater kall under grensen', () => {
    for (let i = 0; i < 30; i++) {
      expect(() => checkRateLimit()).not.toThrow();
    }
  });

  it('kaster ApiClientError med status 429 når grensen overskrides', () => {
    for (let i = 0; i < 30; i++) {
      checkRateLimit();
    }
    let thrown: unknown;
    try {
      checkRateLimit();
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(ApiClientError);
    expect((thrown as ApiClientError).status).toBe(429);
  });

  it('tillater nye kall etter at tidsvinduet er utløpt', () => {
    for (let i = 0; i < 30; i++) {
      checkRateLimit();
    }
    vi.advanceTimersByTime(60_001);
    expect(() => checkRateLimit()).not.toThrow();
  });
});
