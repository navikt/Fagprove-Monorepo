import { useEffect, useState } from 'react';
import { BodyShort, Box, HStack, Link, Loader, LocalAlert } from '@navikt/ds-react';
import { NotFoundPage } from '../NotFoundPage';
import { PageContainer } from '../layout/PageContainer';
import { ApiClientError, hentSak, type SakResponse } from '../../lib/foreldrepenger';
import { SaksvisningContent } from './SaksvisningContent';

interface SaksvisningPageProps {
  sakId: string;
}

export function SaksvisningPage({ sakId }: SaksvisningPageProps) {
  const [sak, setSak] = useState<SakResponse>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSak() {
      setLoading(true);
      setError(undefined);
      setNotFound(false);

      try {
        const response = await hentSak(sakId);
        if (active) {
          setSak(response);
        }
      } catch (loadError) {
        if (!active) {
          return;
        }
        setSak(undefined);
        if (loadError instanceof ApiClientError && loadError.status === 404) {
          setNotFound(true);
        } else {
          setError(getErrorMessage(loadError, 'Kunne ikke hente saken.'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSak();

    return () => {
      active = false;
    };
  }, [sakId]);

  if (loading) {
    return (
      <PageContainer>
        <Link href="/">Tilbake til søknadslisten</Link>
        <Box padding="space-24" className="empty-state" role="status">
          <HStack gap="space-12" align="center">
            <Loader size="medium" title="Henter sak" />
            <BodyShort>Henter sak og regelspor ...</BodyShort>
          </HStack>
        </Box>
      </PageContainer>
    );
  }

  if (notFound) {
    return (
      <PageContainer>
        <Link href="/">Tilbake til søknadslisten</Link>
        <NotFoundPage />
      </PageContainer>
    );
  }

  if (error || !sak) {
    return (
      <PageContainer>
        <Link href="/">Tilbake til søknadslisten</Link>
        <LocalAlert status="error" role="alert" as="div">
          <LocalAlert.Header>
            <LocalAlert.Title as="div">Kunne ikke hente saken</LocalAlert.Title>
          </LocalAlert.Header>
          <BodyShort>{error ?? 'Frontend-API-et returnerte ingen sak.'}</BodyShort>
        </LocalAlert>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SaksvisningContent sak={sak} />
    </PageContainer>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError || error instanceof Error) {
    return error.message;
  }
  return fallback;
}
