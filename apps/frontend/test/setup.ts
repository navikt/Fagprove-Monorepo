import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers, resetMockState } from '../src/mocks/handlers';
import { _resetRateLimitForTests } from '../src/lib/foreldrepenger';

export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  resetMockState();
  _resetRateLimitForTests();
});
afterAll(() => server.close());
