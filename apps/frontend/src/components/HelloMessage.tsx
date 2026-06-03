import { useState } from 'react';
import { Button, BodyLong, InlineMessage, Skeleton, Box } from '@navikt/ds-react';

type FetchState = 'idle' | 'loading' | 'success' | 'error';

export function HelloMessage() {
  const [state, setState] = useState<FetchState>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchGreeting() {
    setState('loading');
    setError(null);

    try {
      const res = await fetch('/api/hello');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setMessage(data.message);
      setState('success');
    } catch {
      setError('Kunne ikke hente hilsen. Prøv igjen senere.');
      setState('error');
    }
  }

  return (
    <Box>
      <Button variant="secondary" onClick={fetchGreeting} loading={state === 'loading'}>
        Hent hilsen
      </Button>

      <Box marginBlock="space-12 space-0" aria-live="polite" aria-busy={state === 'loading'}>
        {state === 'loading' && <Skeleton variant="text" width="100%" height={28} />}
        {state === 'error' && (
          <InlineMessage status="error" size="small" role="alert">
            {error}
          </InlineMessage>
        )}
        {state === 'success' && message && (
          <BodyLong data-testid="hello-message" spacing>
            {message}
          </BodyLong>
        )}
      </Box>
    </Box>
  );
}
