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
  getApplicantLabel,
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

function BabyIcon() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.375 12C9.375 9.71251 10.2837 7.51871 11.9012 5.9012C13.5187 4.2837 15.7125 3.375 18 3.375C20.2875 3.375 22.4813 4.2837 24.0988 5.9012C25.7163 7.51871 26.625 9.71251 26.625 12V24C26.625 26.2875 25.7163 28.4813 24.0988 30.0988C22.4813 31.7163 20.2875 32.625 18 32.625C15.7125 32.625 13.5187 31.7163 11.9012 30.0988C10.2837 28.4813 9.375 26.2875 9.375 24V12ZM18 5.625C16.3092 5.625 14.6877 6.29665 13.4922 7.49219C12.2966 8.68774 11.625 10.3092 11.625 12C11.625 13.6908 12.2966 15.3123 13.4922 16.5078C14.6877 17.7034 16.3092 18.375 18 18.375C19.6908 18.375 21.3123 17.7034 22.5078 16.5078C23.7034 15.3123 24.375 13.6908 24.375 12C24.375 10.3092 23.7034 8.68774 22.5078 7.49219C21.3123 6.29665 19.6908 5.625 18 5.625ZM18 20.625C16.7998 20.6259 15.6128 20.3759 14.5149 19.8911C13.4171 19.4062 12.4327 18.6972 11.625 17.8095V20.3385L17.4 23.5485L24.375 18.8985V17.8095C23.5673 18.6972 22.5829 19.4062 21.4851 19.8911C20.3872 20.3759 19.2002 20.6259 18 20.625ZM11.625 22.9125L15.2955 24.951L12.3345 26.925C11.8651 26.0216 11.6217 25.018 11.625 24V22.9125ZM24.375 21.6015L13.7085 28.713C14.622 29.5446 15.7574 30.0928 16.9767 30.2911C18.196 30.4894 19.4466 30.3292 20.5765 29.83C21.7064 29.3307 22.6669 28.5139 23.3413 27.4789C24.0156 26.4439 24.3748 25.2353 24.375 24V21.6015ZM14.625 12C14.625 11.7016 14.7435 11.4155 14.9545 11.2045C15.1655 10.9935 15.4516 10.875 15.75 10.875H15.765C16.0634 10.875 16.3495 10.9935 16.5605 11.2045C16.7715 11.4155 16.89 11.7016 16.89 12C16.89 12.2984 16.7715 12.5845 16.5605 12.7955C16.3495 13.0065 16.0634 13.125 15.765 13.125H15.75C15.4516 13.125 15.1655 13.0065 14.9545 12.7955C14.7435 12.5845 14.625 12.2984 14.625 12ZM19.125 12C19.125 11.7016 19.2435 11.4155 19.4545 11.2045C19.6655 10.9935 19.9516 10.875 20.25 10.875H20.265C20.5634 10.875 20.8495 10.9935 21.0605 11.2045C21.2715 11.4155 21.39 11.7016 21.39 12C21.39 12.2984 21.2715 12.5845 21.0605 12.7955C20.8495 13.0065 20.5634 13.125 20.265 13.125H20.25C19.9516 13.125 19.6655 13.0065 19.4545 12.7955C19.2435 12.5845 19.125 12Z"
        fill="#202733"
      />
    </svg>
  );
}

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

function getRuleDetailLabel(regel: RegelresultatDto): string {
  const labels: Record<string, string> = {
    OPPTJENING: 'Opptjeningskrav',
    BEREGNINGSGRUNNLAG: 'Beregningsgrunnlag',
    ENGANGSSTONAD: 'Fallback',
    STONADSPERIODE: 'Stønadsperiode',
    KVOTEFORDELING: 'Kvote',
  };

  if (regel.status === 'MANUELL_VURDERING') {
    return 'Aktiv';
  }

  return labels[regel.regel] ?? 'Regelvurdering';
}

function getRuleMarker(status: RegelStatus): string {
  const markers: Record<RegelStatus, string> = {
    OPPFYLT: '✓',
    IKKE_OPPFYLT: '!',
    MANUELL_VURDERING: '!',
  };

  return markers[status];
}

function getManualReason(sak: SakResponse): string | undefined {
  return (
    sak.manuellVurdering?.grunn ??
    sak.regelspor.find((regel) => regel.status === 'MANUELL_VURDERING')?.begrunnelse
  );
}

function CaseHeader({ sak }: { sak: SakResponse }) {
  const saksnummer = getSakLabel(sak.soknad);
  const applicant = getApplicantLabel(sak.soknad);
  const statusLabel = getSakStatusLabel(sak.status, sak.vedtak);

  return (
    <Box as="section" padding="space-24" className="case-header-card">
      <HStack gap="space-24" align="center" wrap={false}>
        <span className="case-header-card__avatar" aria-hidden="true">
          <BabyIcon />
        </span>
        <VStack gap="space-8" className="case-header-card__content">
          <HStack gap="space-12" align="center" wrap>
            <Heading level="1" size="xlarge">
              {saksnummer} · {applicant}
            </Heading>
            <Tag size="medium" variant={getSakTagVariant(sak)}>
              {statusLabel}
            </Tag>
          </HStack>
          <BodyLong>{getScenarioLabel(sak.soknad)}</BodyLong>
          <BodyShort className="table-subtext">
            Søknad {sak.soknad.sokerIdent} · innsendt {sak.soknad.innsendt} · status {statusLabel}
          </BodyShort>
        </VStack>
      </HStack>
    </Box>
  );
}

function RegelsporPanel({ sak }: { sak: SakResponse }) {
  const saksnummer = getSakLabel(sak.soknad);
  const statusLabel = getSakStatusLabel(sak.status, sak.vedtak);

  return (
    <Box as="section" padding="space-24" className="case-rules-panel">
      <VStack gap="space-24">
        <HStack gap="space-12" align="start" justify="space-between" wrap>
          <VStack gap="space-8">
            <Heading level="2" size="large">
              Regler for {saksnummer}
            </Heading>
            <BodyLong>{getScenarioLabel(sak.soknad)}</BodyLong>
          </VStack>
          <Tag size="medium" variant={getSakTagVariant(sak)}>
            {statusLabel}
          </Tag>
        </HStack>

        <ol className="rule-timeline">
          {sak.regelspor.map((regel, index) => (
            <li
              key={`${regel.regel}-${index}`}
              className="rule-timeline__item"
              data-status={regel.status.toLowerCase()}
            >
              <span className="rule-timeline__marker" aria-hidden="true">
                {getRuleMarker(regel.status)}
              </span>
              <VStack gap="space-4">
                <HStack gap="space-8" align="center" wrap>
                  <Heading level="3" size="small">
                    {formatRegelnavn(regel.regel)}
                  </Heading>
                  <BodyShort size="small" className="rule-timeline__status">
                    {formatRegelStatus(regel.status)}
                  </BodyShort>
                </HStack>
                <BodyShort className="table-subtext">{getRuleDetailLabel(regel)}</BodyShort>
                <BodyLong>{regel.begrunnelse}</BodyLong>
              </VStack>
            </li>
          ))}
        </ol>

        <InntektshistorikkTable inntekter={sak.soknad.inntekter} />
      </VStack>
    </Box>
  );
}

function SaksdataPanel({ sak }: { sak: SakResponse }) {
  const soknad = sak.soknad;
  const manualReason = getManualReason(sak);

  return (
    <Box as="aside" padding="space-24" className="case-data-panel">
      <VStack gap="space-24">
        <Heading level="2" size="medium">
          Saksdata
        </Heading>
        <dl className="case-data-list">
          <div>
            <dt>Søkerident</dt>
            <dd>{soknad.sokerIdent}</dd>
          </div>
          <div>
            <dt>Innsendt</dt>
            <dd>{formatIsoDate(soknad.innsendt)}</dd>
          </div>
          <div>
            <dt>Termindato</dt>
            <dd>{formatIsoDate(soknad.termindato)}</dd>
          </div>
          <div>
            <dt>Medlemskap</dt>
            <dd>{soknad.erNorskBorger ? 'Bekreftet' : 'Ikke bekreftet'}</dd>
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
        {manualReason && (
          <Box padding="space-16" className="case-manual-alert" role="status">
            <span className="case-manual-alert__icon" aria-hidden="true">
              !
            </span>
            <BodyLong>{manualReason}</BodyLong>
          </Box>
        )}
      </VStack>
    </Box>
  );
}

function InntektshistorikkTable({ inntekter }: { inntekter: InntektDto[] }) {
  return (
    <Box padding="space-20" className="income-history-card">
      <VStack gap="space-12">
        <HStack align="start" justify="space-between" gap="space-12">
          <VStack gap="space-4">
            <Heading level="3" size="medium">
              Inntektshistorikk
            </Heading>
            <BodyShort>Godkjente måneder i opptjeningsperioden</BodyShort>
          </VStack>
          <span className="income-history-card__chevron" aria-hidden="true">
            ^
          </span>
        </HStack>

        {inntekter.length === 0 ? (
          <Box padding="space-16" className="empty-state">
            <BodyShort>Ingen inntekter er registrert for saken.</BodyShort>
          </Box>
        ) : (
          <div className="income-table-wrapper">
            <Table size="small" aria-label="Inntektshistorikk">
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
                    <Table.DataCell align="right">
                      {formatKroner(inntekt.belopKroner)}
                    </Table.DataCell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}
      </VStack>
    </Box>
  );
}

function SaksvisningContent({ sak }: { sak: SakResponse }) {
  return (
    <VStack gap="space-24" className="case-view">
      <Link href="/">← Tilbake til søknader</Link>

      <CaseHeader sak={sak} />

      <Tabs defaultValue="regelspor">
        <Tabs.List>
          <Tabs.Tab value="regelspor" label="Regelspor" />
          <Tabs.Tab value="vedtak" label="Vedtak" />
        </Tabs.List>

        <Tabs.Panel value="regelspor">
          <Box paddingBlock="space-0">
            <div className="case-detail-grid">
              <RegelsporPanel sak={sak} />
              <SaksdataPanel sak={sak} />
            </div>
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="vedtak">
          <Box paddingBlock="space-24 0">
            <SectionCard title="Vedtak" description="Full vedtaksvisualisering bygges i #29.">
              <BodyShort>Vedtaket vises som egen saksbehandlerflate i neste steg.</BodyShort>
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
