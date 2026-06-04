import { useEffect, useState } from 'react';
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
import { DemoViewToggle } from './DemoViewToggle';
import { PageContainer } from './layout/PageContainer';
import { SectionCard } from './layout/SectionCard';
import {
  ApiClientError,
  formatDekningsgrad,
  formatIsoDate,
  formatRettsforhold,
  getSakLabel,
  getScenarioLabel,
  harKomplisertOppfolging,
  hentSoknader,
  startBehandling,
  type SoknadListeDto,
} from '../lib/foreldrepenger';

interface VelgSoknadPageProps {
  onNavigate?: (path: string) => void;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError || error instanceof Error) {
    return error.message;
  }
  return fallback;
}

function navigateTo(path: string): void {
  window.location.assign(path);
}

function SoknadTable({
  soknader,
  openingSoknadId,
  onOpenSak,
}: {
  soknader: SoknadListeDto[];
  openingSoknadId?: string;
  onOpenSak: (soknad: SoknadListeDto) => void;
}) {
  return (
    <div className="application-table-wrapper">
      <Table zebraStripes size="medium">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell scope="col">Sak</Table.HeaderCell>
            <Table.HeaderCell scope="col">Søker</Table.HeaderCell>
            <Table.HeaderCell scope="col">Innsendt</Table.HeaderCell>
            <Table.HeaderCell scope="col">Scenario</Table.HeaderCell>
            <Table.HeaderCell scope="col">Barn</Table.HeaderCell>
            <Table.HeaderCell scope="col">Dekning</Table.HeaderCell>
            <Table.HeaderCell scope="col">Intern merknad</Table.HeaderCell>
            <Table.HeaderCell scope="col">Handling</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {soknader.map((soknad) => {
            const isOpening = openingSoknadId === soknad.id;

            return (
              <Table.Row key={soknad.id}>
                <Table.DataCell>
                  <BodyShort weight="semibold">{getSakLabel(soknad)}</BodyShort>
                  <BodyShort size="small" className="table-subtext">
                    {soknad.id}
                  </BodyShort>
                </Table.DataCell>
                <Table.DataCell>{soknad.sokerIdent}</Table.DataCell>
                <Table.DataCell>{formatIsoDate(soknad.innsendt)}</Table.DataCell>
                <Table.DataCell>{getScenarioLabel(soknad)}</Table.DataCell>
                <Table.DataCell>
                  <BodyShort>
                    {soknad.antallBarn} barn
                  </BodyShort>
                  <BodyShort size="small" className="table-subtext">
                    Termin {formatIsoDate(soknad.termindato)}
                  </BodyShort>
                </Table.DataCell>
                <Table.DataCell>
                  <BodyShort>{formatDekningsgrad(soknad.dekningsgrad)}</BodyShort>
                  <BodyShort size="small" className="table-subtext">
                    {formatRettsforhold(soknad.rettsforhold)}
                  </BodyShort>
                </Table.DataCell>
                <Table.DataCell>
                  {harKomplisertOppfolging(soknad) ? (
                    <Tag size="small" variant="warning">
                      Komplisert sak
                    </Tag>
                  ) : (
                    <BodyShort size="small" className="table-subtext">
                      Ingen
                    </BodyShort>
                  )}
                </Table.DataCell>
                <Table.DataCell>
                  <Button
                    size="small"
                    disabled={Boolean(openingSoknadId)}
                    onClick={() => onOpenSak(soknad)}
                  >
                    {isOpening ? 'Åpner ...' : 'Åpne sak'}
                  </Button>
                </Table.DataCell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </div>
  );
}

export function VelgSoknadPage({ onNavigate = navigateTo }: VelgSoknadPageProps) {
  const [soknader, setSoknader] = useState<SoknadListeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string>();
  const [openError, setOpenError] = useState<string>();
  const [openingSoknadId, setOpeningSoknadId] = useState<string>();

  useEffect(() => {
    let active = true;

    async function loadSoknader() {
      try {
        const response = await hentSoknader();
        if (active) {
          setSoknader(response);
          setListError(undefined);
        }
      } catch (error) {
        if (active) {
          setListError(getErrorMessage(error, 'Kunne ikke hente søknader.'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSoknader();

    return () => {
      active = false;
    };
  }, []);

  async function handleOpenSak(soknad: SoknadListeDto) {
    setOpenError(undefined);
    setOpeningSoknadId(soknad.id);

    try {
      const response = await startBehandling(soknad.id);
      onNavigate(`/saker/${response.sakId}`);
    } catch (error) {
      setOpenError(getErrorMessage(error, 'Kunne ikke åpne saken. Prøv igjen.'));
      setOpeningSoknadId(undefined);
    }
  }

  return (
    <PageContainer>
      <DemoViewToggle />

      <VStack gap="space-8">
        <Heading level="1" size="xlarge">
          Velg søknad
        </Heading>
        <BodyLong>
          Saksbehandlers arbeidsliste for foreldrepenger. Åpne en søknad for regelspor, vedtak og
          kvotefordeling.
        </BodyLong>
      </VStack>

      <SectionCard
        title="Mine søknader"
        description="Arbeidsliste for Kari Saksbehandler · sortert etter innsendt dato"
      >
        <VStack gap="space-16">
          {openError && (
            <LocalAlert status="error" role="alert" as="div">
              <LocalAlert.Header>
                <LocalAlert.Title as="div">{openError}</LocalAlert.Title>
              </LocalAlert.Header>
            </LocalAlert>
          )}

          {loading && (
            <Box padding="space-24" className="empty-state" role="status">
              <HStack gap="space-12" align="center">
                <Loader size="medium" title="Henter søknader" />
                <BodyShort>Henter søknader fra arbeidslisten ...</BodyShort>
              </HStack>
            </Box>
          )}

          {!loading && listError && (
            <LocalAlert status="error" role="alert" as="div">
              <LocalAlert.Header>
                <LocalAlert.Title as="div">Kunne ikke hente søknader</LocalAlert.Title>
              </LocalAlert.Header>
              <BodyShort>{listError}</BodyShort>
            </LocalAlert>
          )}

          {!loading && !listError && soknader.length === 0 && (
            <Box padding="space-24" className="empty-state">
              <VStack gap="space-8">
                <Heading level="3" size="small">
                  Ingen søknader i arbeidslisten
                </Heading>
                <BodyShort>Det finnes ingen testsøknader som er klare til behandling.</BodyShort>
              </VStack>
            </Box>
          )}

          {!loading && !listError && soknader.length > 0 && (
            <>
              <SoknadTable
                soknader={soknader}
                openingSoknadId={openingSoknadId}
                onOpenSak={(soknad) => void handleOpenSak(soknad)}
              />
              <BodyShort size="small" className="table-subtext">
                Viser {soknader.length} av {soknader.length} søknader
              </BodyShort>
            </>
          )}
        </VStack>
      </SectionCard>
    </PageContainer>
  );
}
