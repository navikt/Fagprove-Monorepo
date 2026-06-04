import { useEffect, useRef, useState } from 'react';
import { BodyShort, Button, HStack, LocalAlert, Textarea, VStack } from '@navikt/ds-react';
import {
  ApiClientError,
  besluttManuelt,
  type ManuellBeslutningType,
  type SakResponse,
} from '../../lib/foreldrepenger';
import { DEMO_BESLUTTET_AV, MAKS_BEGRUNNELSE_TEGN } from './manualDecision';

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

  const isSubmitting = pendingType !== undefined;

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
    <VStack gap="space-16" className="manual-decision-panel">
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
        minRows={3}
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
          variant="tertiary"
          data-color="danger"
          onClick={() => void submitDecision('AVSLAG')}
          loading={pendingType === 'AVSLAG'}
          disabled={isSubmitting}
        >
          Avslå manuelt
        </Button>
      </HStack>
    </VStack>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError || error instanceof Error) {
    return error.message;
  }
  return fallback;
}
