import { useEffect, useState } from 'react';
import {
  BodyLong,
  BodyShort,
  Box,
  Heading,
  HStack,
  Link,
  Loader,
  LocalAlert,
  Table,
  Tabs,
  Tag,
  VStack,
} from '@navikt/ds-react';
import { NotFoundPage } from './NotFoundPage';
import { PageContainer } from './layout/PageContainer';
import { SectionCard } from './layout/SectionCard';
import {
  ApiClientError,
  formatDekningsgrad,
  formatInntektsType,
  formatIsoDate,
  formatKroner,
  formatRegelnavn,
  formatRegelStatus,
  formatRettsforhold,
  formatYearMonth,
  getSakLabel,
  getSakStatusLabel,
  getScenarioLabel,
  hentSak,
  type InntektDto,
  type RegelStatus,
  type RegelresultatDto,
  type SakResponse,
} from '../lib/foreldrepenger';

interface SaksvisningPageProps {
  sakId: string;
}

type TagVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError || error instanceof Error) {
    return error.message;
  }
  return fallback;
}

function getSakTagVariant(sak: SakResponse): TagVariant {
  if (sak.status === 'TIL_MANUELL_VURDERING') {
    return 'warning';
  }
  if (sak.vedtak?.variant === 'AVSLAG') {
    return 'error';
  }
  if (sak.vedtak?.variant === 'INNVILGET' || sak.vedtak?.variant === 'ENGANGSSTONAD') {
    return 'success';
  }
  if (sak.status === 'OPPRETTET') {
    return 'info';
  }

  return 'neutral';
}

function getRegelTagVariant(status: RegelStatus): TagVariant {
  const variants: Record<RegelStatus, TagVariant> = {
    OPPFYLT: 'success',
    IKKE_OPPFYLT: 'error',
    MANUELL_VURDERING: 'warning',
  };

  return variants[status];
}

function RegelsporPanel({ regelspor }: { regelspor: RegelresultatDto[] }) {
  return (
    <SectionCard
      title="Regelspor"
      description="Reglene som faktisk er evaluert i backend for denne saken."
      className="case-detail-panel"
    >
      <VStack gap="space-12">
        {regelspor.map((regel, index) => (
          <Box
            key={`${regel.regel}-${index}`}
            padding="space-16"
            className="rule-trace-step"
            as="article"
          >
            <VStack gap="space-8">
              <HStack gap="space-8" align="center" justify="space-between" wrap>
                <Heading level="3" size="xsmall">
                  {formatRegelnavn(regel.regel)}
                </Heading>
                <Tag size="small" variant={getRegelTagVariant(regel.status)}>
                  {formatRegelStatus(regel.status)}
                </Tag>
              </HStack>
              <BodyShort>{regel.begrunnelse}</BodyShort>
            </VStack>
          </Box>
        ))}
      </VStack>
    </SectionCard>
  );
}

function SaksdataPanel({ sak }: { sak: SakResponse }) {
  const soknad = sak.soknad;

  return (
    <SectionCard
      title="Saksdata"
      description="Data fra søknaden og backend-responsen."
      className="case-detail-panel"
    >
      <dl className="case-data-list">
        <div>
          <dt>Personident</dt>
          <dd>{soknad.sokerIdent}</dd>
        </div>
        <div>
          <dt>Termindato</dt>
          <dd>{formatIsoDate(soknad.termindato)}</dd>
        </div>
        <div>
          <dt>Innsendt dato</dt>
          <dd>{formatIsoDate(soknad.innsendt)}</dd>
        </div>
        <div>
          <dt>Rettsforhold</dt>
          <dd>{formatRettsforhold(soknad.rettsforhold)}</dd>
        </div>
        <div>
          <dt>Dekningsgrad</dt>
          <dd>{formatDekningsgrad(soknad.dekningsgrad)}</dd>
        </div>
        <div>
          <dt>Antall barn</dt>
          <dd>{soknad.antallBarn}</dd>
        </div>
        <div>
          <dt>Oppgitt årsinntekt</dt>
          <dd>{formatKroner(soknad.oppgittAarsinntektKroner)}</dd>
        </div>
      </dl>
    </SectionCard>
  );
}

function InntektshistorikkTable({ inntekter }: { inntekter: InntektDto[] }) {
  return (
    <SectionCard
      title="Inntektshistorikk"
      description="Månedsinntekter brukt av backend i vurderingen."
    >
      {inntekter.length === 0 ? (
        <Box padding="space-16" className="empty-state">
          <BodyShort>Ingen inntekter er registrert for saken.</BodyShort>
        </Box>
      ) : (
        <div className="application-table-wrapper">
          <Table zebraStripes size="medium" aria-label="Inntektshistorikk">
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell scope="col">Måned</Table.HeaderCell>
                <Table.HeaderCell scope="col">Type</Table.HeaderCell>
                <Table.HeaderCell scope="col" align="right">
                  Beløp
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {inntekter.map((inntekt) => (
                <Table.Row key={`${inntekt.maned}-${inntekt.type}-${inntekt.belopKroner}`}>
                  <Table.DataCell>{formatYearMonth(inntekt.maned)}</Table.DataCell>
                  <Table.DataCell>{formatInntektsType(inntekt.type)}</Table.DataCell>
                  <Table.DataCell align="right">{formatKroner(inntekt.belopKroner)}</Table.DataCell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      )}
    </SectionCard>
  );
}

function SaksvisningContent({ sak }: { sak: SakResponse }) {
  const saksnummer = getSakLabel(sak.soknad);
  const statusLabel = getSakStatusLabel(sak.status, sak.vedtak);
  const isManual = sak.status === 'TIL_MANUELL_VURDERING';

  return (
    <VStack gap="space-24">
      <Link href="/">Tilbake til søknadslisten</Link>

      <SectionCard title="Saksoversikt" className="case-header-card">
        <VStack gap="space-16">
          <HStack gap="space-12" align="center" justify="space-between" wrap>
            <VStack gap="space-4">
              <Heading level="1" size="xlarge">
                {saksnummer}
              </Heading>
              <BodyLong>
                {getScenarioLabel(sak.soknad)} · Søker {sak.soknad.sokerIdent}
              </BodyLong>
            </VStack>
            <Tag size="medium" variant={getSakTagVariant(sak)}>
              {statusLabel}
            </Tag>
          </HStack>

          <BodyShort className="table-subtext">
            Søknad {sak.soknad.id} · Innsendt {formatIsoDate(sak.soknad.innsendt)} · Status{' '}
            {statusLabel}
          </BodyShort>

          {isManual && (
            <LocalAlert status="warning" role="status" as="div">
              <LocalAlert.Header>
                <LocalAlert.Title as="div">Venter på manuell vurdering</LocalAlert.Title>
              </LocalAlert.Header>
              <BodyShort>
                Dette er ikke et ferdig vedtak. Saksbehandler må kontrollere saken før beslutning.
              </BodyShort>
              {sak.manuellVurdering?.grunn && <BodyShort>{sak.manuellVurdering.grunn}</BodyShort>}
            </LocalAlert>
          )}
        </VStack>
      </SectionCard>

      <Tabs defaultValue="regelspor">
        <Tabs.List>
          <Tabs.Tab value="regelspor" label="Regelspor" />
          <Tabs.Tab value="vedtak" label="Vedtak" />
          <Tabs.Tab value="intern-oppfolging" label="Intern oppfølging" />
        </Tabs.List>

        <Tabs.Panel value="regelspor">
          <Box paddingBlock="space-24 0">
            <VStack gap="space-24">
              <div className="case-detail-grid">
                <RegelsporPanel regelspor={sak.regelspor} />
                <SaksdataPanel sak={sak} />
              </div>
              <InntektshistorikkTable inntekter={sak.soknad.inntekter} />
            </VStack>
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="vedtak">
          <Box paddingBlock="space-24 0">
            <SectionCard title="Vedtak" description="Full vedtaksvisualisering bygges i #29.">
              <BodyShort>Vedtaket vises som egen saksbehandlerflate i neste steg.</BodyShort>
            </SectionCard>
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="intern-oppfolging">
          <Box paddingBlock="space-24 0">
            <SectionCard
              title="Intern oppfølging"
              description="Interne merknader kobles på når oppfølgingsdata er tilgjengelig."
            >
              <BodyShort>Ingen intern oppfølging vises i denne saksvisningen ennå.</BodyShort>
            </SectionCard>
          </Box>
        </Tabs.Panel>
      </Tabs>
    </VStack>
  );
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
