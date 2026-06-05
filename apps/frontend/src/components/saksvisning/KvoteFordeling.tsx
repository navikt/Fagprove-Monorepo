import { BodyShort, Box, HStack, Table, Tag, VStack } from '@navikt/ds-react';
import { type KvoterDto } from '../../lib/foreldrepenger';
import { formatUker } from './helpers';
import { getKvoteSegments } from './kvoteSegments';

interface KvoteFordelingProps {
  kvoter: KvoterDto;
}

export function KvoteFordeling({ kvoter }: KvoteFordelingProps) {
  const segments = getKvoteSegments(kvoter).filter((segment) => segment.uker > 0);
  const visualSegments = segments.filter((segment) => segment.uker > 0 && kvoter.totalUker > 0);

  const fordelingLabel = `Kvotefordeling: ${visualSegments
    .map((segment) => `${segment.label} ${formatUker(segment.uker)}`)
    .join(', ')}. Total ${formatUker(kvoter.totalUker)}.`;

  return (
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
            <div className="quota-bar" role="img" aria-label={fordelingLabel}>
              {visualSegments.map((segment) => (
                <div
                  key={segment.label}
                  className="quota-bar__segment"
                  data-tone={segment.tone}
                  style={{ width: `${(segment.uker / kvoter.totalUker) * 100}%` }}
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
  );
}
