import { useEffect, useRef, useState } from 'react';
import {
  BodyLong,
  BodyShort,
  Box,
  Button,
  Heading,
  HStack,
  LocalAlert,
  Table,
  Textarea,
  VStack,
} from '@navikt/ds-react';
import {
  ApiClientError,
  besluttManuelt,
  formatKroner,
  formatRegelnavn,
  formatRegelStatus,
  type ManuellBeslutningType,
  type RegelresultatDto,
  type SakResponse,
} from '../../lib/foreldrepenger';

const DEMO_BESLUTTET_AV = 'Kari Saksbehandler';
const MAKS_BEGRUNNELSE_TEGN = 1_000;

interface ManuellBeslutningPanelProps {
  sak: SakResponse;
  onDecisionSaved: (sak: SakResponse) => void;
}

export function ManuellBeslutningPanel({ sak, onDecisionSaved }: ManuellBeslutningPanelProps) {
  const [begrunnelse, setBegrunnelse] = useState('');
  const [begrunnelseError, setBegrunnelseError] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();
  const [pendingType, setPendingType] = useState<ManuellBeslutningType>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submitErrorRef = useRef<HTMLDivElement>(null);

  const beregningsgrunnlag = sak.regelspor.find((regel) => regel.regel === 'BEREGNINGSGRUNNLAG');
  const manualRules = getManualRules(sak.regelspor);
  const isSubmitting = pendingType !== undefined;
  const manualReason =
    sak.manuellVurdering?.grunn ??
    manualRules[0]?.begrunnelse ??
    'Saken må vurderes manuelt før endelig vedtak kan fattes.';

  useEffect(() => {
    if (submitError) {
      submitErrorRef.current?.focus();
    }
  }, [submitError]);

  async function submitDecision(type: ManuellBeslutningType) {
    const trimmedBegrunnelse = begrunnelse.trim();
    if (!trimmedBegrunnelse) {
      setSubmitError(undefined);
      setBegrunnelseError('Begrunnelse må fylles ut før du kan fatte manuelt vedtak.');
      textareaRef.current?.focus();
      return;
    }

    setBegrunnelseError(undefined);
    setSubmitError(undefined);
    setPendingType(type);

    try {
      const updatedSak = await besluttManuelt(sak.sakId, {
        type,
        begrunnelse: trimmedBegrunnelse,
        besluttetAv: DEMO_BESLUTTET_AV,
      });
      onDecisionSaved(updatedSak);
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Kunne ikke lagre manuell beslutning. Prøv igjen.'));
    } finally {
      setPendingType(undefined);
    }
  }

  return (
    <Box borderWidth="1" padding="space-20" className="manual-decision-panel">
      <VStack gap="space-16">
        <VStack gap="space-8">
          <Heading level="3" size="medium">
            Manuell behandling
          </Heading>
          <BodyLong>
            Velg manuell innvilgelse eller avslag når grunnlaget er vurdert. Manuell vurdering er
            ikke et endelig vedtak.
          </BodyLong>
        </VStack>

        <LocalAlert status="warning" role="note" as="div">
          <LocalAlert.Header>
            <LocalAlert.Title as="div">Årsak til manuell vurdering</LocalAlert.Title>
          </LocalAlert.Header>
          <LocalAlert.Content>
            <BodyShort>{manualReason}</BodyShort>
          </LocalAlert.Content>
        </LocalAlert>

        <Table size="small" aria-label="Nøkkelinformasjon for manuell behandling">
          <Table.Body>
            <ManualKeyValueRow
              label="Oppgitt årsinntekt"
              value={formatKroner(sak.soknad.oppgittAarsinntektKroner)}
            />
            <ManualKeyValueRow
              label="Beregningsgrunnlag"
              value={beregningsgrunnlag?.begrunnelse ?? 'Ikke returnert fra regelspor'}
            />
            <ManualKeyValueRow
              label="Status for beregningsgrunnlag"
              value={beregningsgrunnlag ? formatRegelStatus(beregningsgrunnlag.status) : '—'}
            />
          </Table.Body>
        </Table>

        {manualRules.length > 0 && (
          <Table size="small" aria-label="Regelspor for manuell behandling">
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell scope="col">Regel</Table.HeaderCell>
                <Table.HeaderCell scope="col">Status</Table.HeaderCell>
                <Table.HeaderCell scope="col">Begrunnelse</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {manualRules.map((regel) => (
                <Table.Row key={`${regel.regel}-${regel.status}`}>
                  <Table.HeaderCell scope="row">{formatRegelnavn(regel.regel)}</Table.HeaderCell>
                  <Table.DataCell>{formatRegelStatus(regel.status)}</Table.DataCell>
                  <Table.DataCell>{regel.begrunnelse}</Table.DataCell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}

        <Textarea
          ref={textareaRef}
          id="manuell-beslutning-begrunnelse"
          label="Saksbehandlers begrunnelse"
          description="Begrunnelsen lagres på det endelige vedtaket."
          value={begrunnelse}
          onChange={(event) => {
            setBegrunnelse(event.target.value);
            if (begrunnelseError && event.target.value.trim()) {
              setBegrunnelseError(undefined);
            }
          }}
          error={begrunnelseError}
          maxLength={MAKS_BEGRUNNELSE_TEGN}
          minRows={4}
          disabled={isSubmitting}
        />

        {submitError && (
          <div ref={submitErrorRef} tabIndex={-1}>
            <LocalAlert status="error" role="alert" as="div">
              <LocalAlert.Header>
                <LocalAlert.Title as="div">Kunne ikke lagre manuell beslutning</LocalAlert.Title>
              </LocalAlert.Header>
              <LocalAlert.Content>
                <BodyShort>{submitError}</BodyShort>
              </LocalAlert.Content>
            </LocalAlert>
          </div>
        )}

        <HStack gap="space-12" align="center" wrap>
          <Button
            type="button"
            onClick={() => void submitDecision('INNVILGELSE')}
            loading={pendingType === 'INNVILGELSE'}
            disabled={isSubmitting}
          >
            Innvilg manuelt
          </Button>
          <Button
            type="button"
            variant="secondary"
            data-color="danger"
            onClick={() => void submitDecision('AVSLAG')}
            loading={pendingType === 'AVSLAG'}
            disabled={isSubmitting}
          >
            Avslå manuelt
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}

function getManualRules(regelspor: RegelresultatDto[]): RegelresultatDto[] {
  return regelspor.filter(
    (regel) => regel.status === 'MANUELL_VURDERING' || regel.regel === 'BEREGNINGSGRUNNLAG',
  );
}

function ManualKeyValueRow({ label, value }: { label: string; value: string }) {
  return (
    <Table.Row>
      <Table.HeaderCell scope="row">{label}</Table.HeaderCell>
      <Table.DataCell>{value}</Table.DataCell>
    </Table.Row>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError || error instanceof Error) {
    return error.message;
  }
  return fallback;
}
