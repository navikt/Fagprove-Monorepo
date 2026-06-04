import { Accordion, BodyShort, Box, Table, VStack } from '@navikt/ds-react';
import {
  formatInntektsType,
  formatKroner,
  formatYearMonth,
  type InntektDto,
} from '../../lib/foreldrepenger';

export function Inntektshistorikk({ inntekter }: { inntekter: InntektDto[] }) {
  return (
    <Accordion size="small" indent={false}>
      <Accordion.Item>
        <Accordion.Header>
          <VStack gap="space-4">
            <span className="aksel-heading aksel-heading--medium">Inntektshistorikk</span>
            <span className="aksel-body-short aksel-body-short--small">
              Godkjente måneder i opptjeningsperioden
            </span>
          </VStack>
        </Accordion.Header>
        <Accordion.Content>
          {inntekter.length === 0 ? (
            <Box padding="space-16" className="empty-state">
              <BodyShort>Ingen inntekter er registrert for saken.</BodyShort>
            </Box>
          ) : (
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
          )}
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}
