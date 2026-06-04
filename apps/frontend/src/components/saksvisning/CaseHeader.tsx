import { BodyLong, BodyShort, Box, Heading, HStack, Tag, VStack } from '@navikt/ds-react';
import {
  getApplicantLabel,
  getSakLabel,
  getSakStatusLabel,
  getScenarioLabel,
  type SakResponse,
} from '../../lib/foreldrepenger';
import { BabyIcon } from './BabyIcon';
import { getSakTagVariant } from './helpers';

export function CaseHeader({ sak }: { sak: SakResponse }) {
  const statusLabel = getSakStatusLabel(sak.status, sak.vedtak);

  return (
    <Box as="section" padding="space-24" borderWidth="1" borderRadius="0">
      <HStack gap="space-24" align="center" wrap>
        <Box padding="space-12" borderWidth="1" borderRadius="0" aria-hidden="true">
          <BabyIcon />
        </Box>
        <VStack gap="space-8">
          <HStack gap="space-12" align="center" wrap>
            <Heading level="1" size="xlarge">
              {getSakLabel(sak.soknad)} · {getApplicantLabel(sak.soknad)}
            </Heading>
            <Tag size="medium" variant={getSakTagVariant(sak)}>
              {statusLabel}
            </Tag>
          </HStack>
          <BodyLong>{getScenarioLabel(sak.soknad)}</BodyLong>
          <BodyShort>
            Søknad {sak.soknad.sokerIdent} · innsendt {sak.soknad.innsendt} · status {sak.status}
          </BodyShort>
        </VStack>
      </HStack>
    </Box>
  );
}
