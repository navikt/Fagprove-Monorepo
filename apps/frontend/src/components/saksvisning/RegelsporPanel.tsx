import { BodyLong, BodyShort, Box, Heading, HStack, Table, Tag, VStack } from '@navikt/ds-react';
import {
  formatRegelnavn,
  formatRegelStatus,
  getSakLabel,
  getSakStatusLabel,
  getScenarioLabel,
  type SakResponse,
} from '../../lib/foreldrepenger';
import { getRegelStatusTagVariant, getRuleDetailLabel, getSakTagVariant } from './helpers';
import { Inntektshistorikk } from './Inntektshistorikk';

export function RegelsporPanel({ sak }: { sak: SakResponse }) {
  const statusLabel = getSakStatusLabel(sak.status, sak.vedtak);

  return (
    <Box as="section" padding="space-24" borderWidth="1" borderRadius="0">
      <VStack gap="space-24">
        <HStack gap="space-12" align="start" justify="space-between" wrap>
          <VStack gap="space-8">
            <Heading level="2" size="large">
              Regler for {getSakLabel(sak.soknad)}
            </Heading>
            <BodyLong>{getScenarioLabel(sak.soknad)}</BodyLong>
          </VStack>
          <Tag size="medium" variant={getSakTagVariant(sak)}>
            {statusLabel}
          </Tag>
        </HStack>

        <Table size="small" aria-label="Regelspor">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell scope="col">Regel</Table.HeaderCell>
              <Table.HeaderCell scope="col">Status</Table.HeaderCell>
              <Table.HeaderCell scope="col">Begrunnelse</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sak.regelspor.map((regel, index) => (
              <Table.Row key={`${regel.regel}-${index}`}>
                <Table.HeaderCell scope="row">
                  <VStack gap="space-4">
                    <Heading level="3" size="small">
                      {formatRegelnavn(regel.regel)}
                    </Heading>
                    <BodyShort size="small">{getRuleDetailLabel(regel)}</BodyShort>
                  </VStack>
                </Table.HeaderCell>
                <Table.DataCell>
                  <Tag size="small" variant={getRegelStatusTagVariant(regel.status)}>
                    {formatRegelStatus(regel.status)}
                  </Tag>
                </Table.DataCell>
                <Table.DataCell>{regel.begrunnelse}</Table.DataCell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>

        <Inntektshistorikk inntekter={sak.soknad.inntekter} />
      </VStack>
    </Box>
  );
}
