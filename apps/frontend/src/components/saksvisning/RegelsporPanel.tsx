import { BodyLong, Box, Heading, HStack, Tag, VStack } from '@navikt/ds-react';
import {
  getSakLabel,
  getSakStatusLabel,
  getScenarioLabel,
  type SakResponse,
} from '../../lib/foreldrepenger';
import { getSakTagVariant } from './helpers';
import { Inntektshistorikk } from './Inntektshistorikk';
import { RegelsporTimeline } from './RegelsporTimeline';

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

        <RegelsporTimeline regelspor={sak.regelspor} />

        <Inntektshistorikk inntekter={sak.soknad.inntekter} />
      </VStack>
    </Box>
  );
}
