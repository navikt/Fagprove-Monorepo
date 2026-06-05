import { useCallback, useEffect, useState } from 'react';
import {
  BodyLong,
  BodyShort,
  Box,
  Button,
  Heading,
  HStack,
  Loader,
  LocalAlert,
  Table,
  Tag,
  VStack,
} from '@navikt/ds-react';
import { SectionCard } from './layout/SectionCard';
import {
  ApiClientError,
  formatIsoDate,
  formatIsoDateTime,
  getSakStatusLabel,
  getVedtaksvariantLabel,
  listInterneMerknader,
  type InternMerknadOversikt,
} from '../lib/foreldrepenger';

interface TeamlederOversiktPageProps {
  onNavigate: (path: string) => void;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError || error instanceof Error) {
    return error.message;
  }
  return fallback;
}

function formatOppdatert(tidspunkt: string | null): string {
  if (!tidspunkt) {
    return 'ukjent tidspunkt';
  }
  if (tidspunkt.includes('T')) {
    return formatIsoDateTime(tidspunkt);
  }
  return formatIsoDate(tidspunkt);
}

function MerknadTable({
  saker,
  onNavigate,
}: {
  saker: InternMerknadOversikt[];
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="application-table-wrapper">
      <Table zebraStripes size="medium">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell scope="col">Sak</Table.HeaderCell>
            <Table.HeaderCell scope="col">Søker</Table.HeaderCell>
            <Table.HeaderCell scope="col">Status</Table.HeaderCell>
            <Table.HeaderCell scope="col">Vedtak</Table.HeaderCell>
            <Table.HeaderCell scope="col">Intern merknad</Table.HeaderCell>
            <Table.HeaderCell scope="col">Intern kommentar</Table.HeaderCell>
            <Table.HeaderCell scope="col">Saksbehandler</Table.HeaderCell>
            <Table.HeaderCell scope="col">Sist oppdatert</Table.HeaderCell>
            <Table.HeaderCell scope="col">Handling</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {saker.map((sak) => (
            <Table.Row key={sak.sakId}>
              <Table.DataCell>
                <BodyShort weight="semibold">{sak.saksnummer}</BodyShort>
              </Table.DataCell>
              <Table.DataCell>{sak.sokerIdent}</Table.DataCell>
              <Table.DataCell>{getSakStatusLabel(sak.status)}</Table.DataCell>
              <Table.DataCell>{getVedtaksvariantLabel(sak.vedtaksvariant)}</Table.DataCell>
              <Table.DataCell>
                {sak.komplisert ? (
                  <Tag size="small" variant="warning">
                    Komplisert sak
                  </Tag>
                ) : (
                  <Tag size="small" variant="neutral">
                    Til oppfølging
                  </Tag>
                )}
              </Table.DataCell>
              <Table.DataCell>{sak.kommentar}</Table.DataCell>
              <Table.DataCell>{sak.oppdatertAv}</Table.DataCell>
              <Table.DataCell>{formatOppdatert(sak.oppdatertTidspunkt)}</Table.DataCell>
              <Table.DataCell>
                <Button size="small" onClick={() => onNavigate(`/saker/${sak.sakId}`)}>
                  Åpne sak
                </Button>
              </Table.DataCell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}

export function TeamlederOversiktPage({ onNavigate }: TeamlederOversiktPageProps) {
  const [saker, setSaker] = useState<InternMerknadOversikt[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string>();

  const loadMerknader = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listInterneMerknader();
      setSaker(response);
      setListError(undefined);
    } catch (error) {
      setListError(getErrorMessage(error, 'Kunne ikke hente interne merknader.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMerknader();
  }, [loadMerknader]);

  return (
    <>
      <VStack gap="space-8">
        <Heading level="1" size="xlarge">
          Saker med intern oppfølging
        </Heading>
        <BodyLong>
          Oversikten brukes til intern oppfølging, læring og forbedring av fremtidig saksbehandling.
        </BodyLong>
      </VStack>

      <SectionCard
        title="Oversikt over kompliserte saker"
        description="Teamledervisningen viser bare saker som er markert med intern oppfølging."
      >
        <VStack gap="space-16">
          {loading && (
            <Box padding="space-24" className="empty-state" role="status">
              <HStack gap="space-12" align="center">
                <Loader size="medium" title="Henter interne merknader" />
                <BodyShort>Henter saker med intern oppfølging ...</BodyShort>
              </HStack>
            </Box>
          )}

          {!loading && listError && (
            <LocalAlert status="error" role="alert" as="div">
              <LocalAlert.Header>
                <LocalAlert.Title as="div">Kunne ikke hente interne merknader</LocalAlert.Title>
              </LocalAlert.Header>
              <BodyShort>{listError}</BodyShort>
            </LocalAlert>
          )}

          {!loading && !listError && saker.length === 0 && (
            <Box padding="space-24" className="empty-state">
              <VStack gap="space-8">
                <Heading level="3" size="small">
                  Ingen saker med intern oppfølging
                </Heading>
                <BodyShort>
                  Når en saksbehandler markerer en sak med intern oppfølging, dukker den opp her.
                </BodyShort>
              </VStack>
            </Box>
          )}

          {!loading && !listError && saker.length > 0 && (
            <>
              <MerknadTable saker={saker} onNavigate={onNavigate} />
              <BodyShort size="small" className="table-subtext">
                Viser {saker.length} {saker.length === 1 ? 'sak' : 'saker'} med intern oppfølging
              </BodyShort>
            </>
          )}
        </VStack>
      </SectionCard>
    </>
  );
}
