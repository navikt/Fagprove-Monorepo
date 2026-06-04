import { useRef } from 'react';
import { BodyLong, Box, Heading, HStack, Table, Tag, VStack } from '@navikt/ds-react';
import { formatKroner, getVedtaksvariantLabel, type SakResponse } from '../../lib/foreldrepenger';
import { formatUker, getManualReason, getOpptjeningStatus, getVedtaksTagVariant } from './helpers';
import { ManuellBeslutningPanel } from './ManuellBeslutningPanel';

interface VedtakPanelProps {
  sak: SakResponse;
  onSakChange: (sak: SakResponse) => void;
}

export function VedtakPanel({ sak, onSakChange }: VedtakPanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const manualReason = getManualReason(sak);
  const shouldShowManualDecisionPanel =
    sak.status === 'TIL_MANUELL_VURDERING' && Boolean(sak.manuellVurdering) && !sak.vedtak;
  const variant =
    sak.vedtak?.variant ??
    (sak.status === 'TIL_MANUELL_VURDERING' ? 'MANUELL_VURDERING' : undefined);
  const begrunnelse =
    sak.status === 'TIL_MANUELL_VURDERING'
      ? (manualReason ?? 'Saksbehandler må vurdere grunnlaget.')
      : (sak.vedtak?.begrunnelse ?? 'Backend har ikke returnert begrunnelse.');
  const beregningsgrunnlag =
    typeof sak.vedtak?.belopKroner === 'number' ? formatKroner(sak.vedtak.belopKroner) : '—';
  const stonadsperiode = sak.vedtak?.stonadsperiode
    ? formatUker(sak.vedtak.stonadsperiode.uker)
    : '—';

  function handleSakChange(updatedSak: SakResponse) {
    onSakChange(updatedSak);
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  return (
    <Box as="section" padding="space-24" borderWidth="1" borderRadius="0">
      <VStack gap="space-16">
        <HStack gap="space-12" align="center" wrap>
          <span aria-hidden="true">▦</span>
          <Heading
            level="2"
            size="large"
            ref={headingRef}
            tabIndex={-1}
            className="decision-heading"
          >
            Vedtak og beregning
          </Heading>
        </HStack>
        <Tag size="medium" variant={getVedtaksTagVariant(variant)}>
          {variant ? getVedtaksvariantLabel(variant) : 'Ikke avklart'}
        </Tag>
        <BodyLong>{begrunnelse}</BodyLong>
        {sak.status === 'TIL_MANUELL_VURDERING' && (
          <BodyLong>Saken må behandles manuelt før endelig vedtak kan fattes.</BodyLong>
        )}

        <Table size="small" aria-label="Vedtak og beregning">
          <Table.Body>
            <VedtakRow label="Status" value={sak.status} />
            <VedtakRow label="Vedtaksvariant" value={variant ?? '—'} />
            <VedtakRow label="Opptjening" value={getOpptjeningStatus(sak)} />
            <VedtakRow label="Beregningsgrunnlag" value={beregningsgrunnlag} />
            <VedtakRow label="Stønadsperiode" value={stonadsperiode} />
            {sak.vedtak?.besluttetAv && (
              <VedtakRow label="Besluttet av" value={sak.vedtak.besluttetAv} />
            )}
            {sak.vedtak?.besluttetTidspunkt && (
              <VedtakRow label="Besluttet tidspunkt" value={sak.vedtak.besluttetTidspunkt} />
            )}
          </Table.Body>
        </Table>

        {shouldShowManualDecisionPanel && (
          <ManuellBeslutningPanel sak={sak} onDecisionSaved={handleSakChange} />
        )}
      </VStack>
    </Box>
  );
}

function VedtakRow({ label, value }: { label: string; value: string }) {
  return (
    <Table.Row>
      <Table.HeaderCell scope="row">{label}</Table.HeaderCell>
      <Table.DataCell>{value}</Table.DataCell>
    </Table.Row>
  );
}
