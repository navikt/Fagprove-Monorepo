import { BodyLong, Box, Heading, HStack, Table, VStack } from '@navikt/ds-react';
import { formatKroner, getVedtaksvariantLabel, type SakResponse } from '../../lib/foreldrepenger';
import { formatUker, getManualReason, getOpptjeningStatus } from './helpers';

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
  const beregningsgrunnlag =
    typeof sak.vedtak?.belopKroner === 'number' ? formatKroner(sak.vedtak.belopKroner) : '—';
  const stonadsperiode = sak.vedtak?.stonadsperiode
    ? formatUker(sak.vedtak.stonadsperiode.uker)
    : '—';

  return (
    <Box as="section" padding="space-24" borderWidth="1" borderRadius="0">
      <VStack gap="space-16">
        <HStack gap="space-12" align="center" wrap>
          <span aria-hidden="true">▦</span>
          <Heading level="2" size="large" className="decision-heading">
            Vedtak og beregning
          </Heading>
        </HStack>
        <div className="decision-status-banner" data-variant={variant ?? 'IKKE_AVKLART'}>
          {variant ? getVedtaksvariantLabel(variant) : 'Ikke avklart'}
        </div>
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
