import { BodyShort, Box, Heading, HStack, LocalAlert, Table, Tag, VStack } from '@navikt/ds-react';
import { type KvoterDto } from '../../lib/foreldrepenger';
import { formatUker } from './helpers';
import { getKvoteSegments } from './kvoteSegments';

export function Kvotevisualisering({ kvoter }: { kvoter?: KvoterDto | null }) {
  const segments = kvoter ? getKvoteSegments(kvoter).filter((segment) => segment.uker > 0) : [];
  const visualSegments = kvoter
    ? segments.filter((segment) => segment.uker > 0 && kvoter.totalUker > 0)
    : [];

  return (
    <Box as="section" padding="space-24" borderWidth="1" borderRadius="0">
      <VStack gap="space-20">
        <Heading level="2" size="large">
          Kvotevisualisering
        </Heading>

        <LocalAlert status="info" role="note" as="div">
          <LocalAlert.Content>
            {kvoter
              ? 'Kvoteplanen vises som en Aksel-basert fordelingslinje med tabell som kontrollgrunnlag.'
              : 'Kvote beregnes bare for innvilgede foreldrepenger.'}
          </LocalAlert.Content>
        </LocalAlert>

        {kvoter && (
          <>
            <Box padding="space-12" borderWidth="1">
              <VStack gap="space-8">
                <HStack gap="space-8" align="center" justify="space-between">
                  <BodyShort weight="semibold">Fordeling av stønadsperioden</BodyShort>
                  <Tag size="small" variant="info">
                    {formatUker(kvoter.totalUker)} totalt
                  </Tag>
                </HStack>
                {visualSegments.length > 0 ? (
                  <div
                    className="quota-bar"
                    role="img"
                    aria-label={`Kvotevisualisering med total ${formatUker(kvoter.totalUker)}`}
                  >
                    {visualSegments.map((segment) => (
                      <div
                        key={segment.label}
                        className="quota-bar__segment"
                        data-tone={segment.tone}
                        style={{ width: `${(segment.uker / kvoter.totalUker) * 100}%` }}
                        aria-label={`${segment.label} ${formatUker(segment.uker)}`}
                      >
                        {segment.uker}
                      </div>
                    ))}
                  </div>
                ) : (
                  <Box padding="space-16" className="empty-state">
                    <BodyShort>Backend har ikke returnert kvoteuker for visualisering.</BodyShort>
                  </Box>
                )}
                <HStack gap="space-4" wrap>
                  {segments.map((segment) => (
                    <Tag key={segment.label} size="small" variant="info">
                      {segment.shortLabel}: {formatUker(segment.uker)}
                    </Tag>
                  ))}
                </HStack>
              </VStack>
            </Box>

            <Table size="small" aria-label="Kvoteoversikt">
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell scope="col">Kvote</Table.HeaderCell>
                  <Table.HeaderCell scope="col" align="right">
                    Uker
                  </Table.HeaderCell>
                  <Table.HeaderCell scope="col">Forklaring</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {segments.map((segment) => (
                  <Table.Row key={segment.label}>
                    <Table.HeaderCell scope="row">{segment.label}</Table.HeaderCell>
                    <Table.DataCell align="right">{segment.uker}</Table.DataCell>
                    <Table.DataCell>{segment.forklaring}</Table.DataCell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </>
        )}
      </VStack>
    </Box>
  );
}
