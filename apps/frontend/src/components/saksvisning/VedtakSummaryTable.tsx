import { Table } from '@navikt/ds-react';
import { formatKroner, type SakResponse, type Vedtaksvariant } from '../../lib/foreldrepenger';
import { formatUker, getOpptjeningStatus } from './helpers';

interface VedtakSummaryTableProps {
  sak: SakResponse;
  variant?: Vedtaksvariant;
}

export function VedtakSummaryTable({ sak, variant }: VedtakSummaryTableProps) {
  const beregningsgrunnlag =
    typeof sak.vedtak?.belopKroner === 'number' ? formatKroner(sak.vedtak.belopKroner) : '—';
  const stonadsperiode = sak.vedtak?.stonadsperiode
    ? formatUker(sak.vedtak.stonadsperiode.uker)
    : '—';

  return (
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
