import { BodyLong, Box, Heading, HStack, VStack } from '@navikt/ds-react';
import { type SakResponse } from '../../lib/foreldrepenger';
import { getManualReason } from './helpers';
import { VedtakStatusBanner } from './VedtakStatusBanner';
import { VedtakSummaryTable } from './VedtakSummaryTable';

interface VedtakPanelProps {
  sak: SakResponse;
}

export function VedtakPanel({ sak }: VedtakPanelProps) {
  const manualReason = getManualReason(sak);
  const variant =
    sak.vedtak?.variant ??
    (sak.status === 'TIL_MANUELL_VURDERING' ? 'MANUELL_VURDERING' : undefined);
  const begrunnelse =
    sak.status === 'TIL_MANUELL_VURDERING'
      ? (manualReason ?? 'Saksbehandler må vurdere grunnlaget.')
      : (sak.vedtak?.begrunnelse ?? 'Backend har ikke returnert begrunnelse.');

  return (
    <Box as="section" padding="space-24" borderWidth="1" borderRadius="0">
      <VStack gap="space-16">
        <HStack gap="space-12" align="center" wrap>
          <span aria-hidden="true">▦</span>
          <Heading level="2" size="large" className="decision-heading">
            Vedtak og beregning
          </Heading>
        </HStack>
        <VedtakStatusBanner variant={variant} />
        <BodyLong>{begrunnelse}</BodyLong>
        {sak.status === 'TIL_MANUELL_VURDERING' && (
          <BodyLong>Saken må behandles manuelt før endelig vedtak kan fattes.</BodyLong>
        )}

        <VedtakSummaryTable sak={sak} variant={variant} />
      </VStack>
    </Box>
  );
}
