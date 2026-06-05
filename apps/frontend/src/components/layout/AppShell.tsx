import type { ReactNode } from 'react';
import { InternalHeader, Page, Spacer } from '@navikt/ds-react';
import './AppShell.css';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <Page className="app-shell" contentBlockPadding="none">
      <a href="#main-content" className="skip-link">
        Hopp til hovedinnhold
      </a>
      <InternalHeader className="app-shell__header">
        <nav aria-label="Hovednavigasjon" className="app-shell__navigation">
          <InternalHeader.Title href="/">Foreldrepenger</InternalHeader.Title>
        </nav>
        <Spacer />
        <InternalHeader.User name="Kari Saksbehandler" description="Avdeling foreldrepenger" />
      </InternalHeader>
      <Page.Block
        as="main"
        width="xl"
        gutters
        id="main-content"
        tabIndex={-1}
        className="app-shell__main"
      >
        {children}
      </Page.Block>
    </Page>
  );
}
