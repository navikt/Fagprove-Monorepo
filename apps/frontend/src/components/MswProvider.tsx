import { useEffect } from 'react';

declare global {
  interface Window {
    __mswReady__: boolean;
  }
}

export function MswProvider() {
  useEffect(() => {
    import('../mocks/browser')
      .then(({ worker }) => worker.start({ onUnhandledRequest: 'bypass' }))
      .then(() => {
        window.__mswReady__ = true;
      })
      .catch((error: unknown) => {
        if (import.meta.env.DEV) {
          console.warn('Kunne ikke starte MSW i nettleseren', error);
        }
      });
  }, []);

  return null;
}
