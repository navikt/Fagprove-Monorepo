import { BodyShort, Box, Heading, LocalAlert, Table, VStack } from '@navikt/ds-react';
import {
  formatDekningsgrad,
  formatIsoDate,
  formatKroner,
  formatRettsforhold,
  type SakResponse,
} from '../../../lib/foreldrepenger';
import { getManualReason } from '../utils/helpers';

export function SaksdataPanel({ sak }: { sak: SakResponse }) {
  const soknad = sak.soknad;
  const manualReason = getManualReason(sak);

  return (
    <Box as="aside" padding="space-24" borderWidth="1" borderRadius="0">
      <VStack gap="space-24">
        <Heading level="2" size="medium">
          Saksdata
        </Heading>

        <Table size="small" aria-label="Saksdata">
          <Table.Body>
            <SaksdataRow label="Søkerident" value={soknad.sokerIdent} />
            <SaksdataRow label="Innsendt" value={formatIsoDate(soknad.innsendt)} />
            <SaksdataRow label="Termindato" value={formatIsoDate(soknad.termindato)} />
            <SaksdataRow
              label="Medlemskap"
              value={soknad.erNorskBorger ? 'Bekreftet' : 'Ikke bekreftet'}
            />
            <SaksdataRow label="Rettsforhold" value={formatRettsforhold(soknad.rettsforhold)} />
            <SaksdataRow label="Dekningsgrad" value={formatDekningsgrad(soknad.dekningsgrad)} />
            <SaksdataRow label="Antall barn" value={String(soknad.antallBarn)} />
            <SaksdataRow
              label="Oppgitt årsinntekt"
              value={formatKroner(soknad.oppgittAarsinntektKroner)}
            />
          </Table.Body>
        </Table>

        {manualReason && (
          <LocalAlert status="warning" role="status" as="div">
            <LocalAlert.Content>
              <BodyShort>{manualReason}</BodyShort>
            </LocalAlert.Content>
          </LocalAlert>
        )}
      </VStack>
    </Box>
  );
}

function SaksdataRow({ label, value }: { label: string; value: string }) {
  return (
    <Table.Row>
      <Table.HeaderCell scope="row">{label}</Table.HeaderCell>
      <Table.DataCell align="right">{value}</Table.DataCell>
    </Table.Row>
  );
}
