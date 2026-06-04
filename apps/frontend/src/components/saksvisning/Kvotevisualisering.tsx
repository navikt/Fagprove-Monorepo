import { useRef } from 'react';
import { Box, Heading, LocalAlert, VStack } from '@navikt/ds-react';
import { type KvoterDto, type SakResponse } from '../../lib/foreldrepenger';
import { KvoteFordeling } from './KvoteFordeling';
import { shouldShowManualDecision } from './manualDecision';
import { ManuellBeslutningPanel } from './ManuellBeslutningPanel';

interface KvotevisualiseringProps {
  kvoter?: KvoterDto | null;
  sak: SakResponse;
  onSakChange: (sak: SakResponse) => void;
}

export function Kvotevisualisering({ kvoter, sak, onSakChange }: KvotevisualiseringProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  function handleSakChange(updatedSak: SakResponse) {
    onSakChange(updatedSak);
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  return (
    <Box as="section" padding="space-24" borderWidth="1" borderRadius="0">
      <VStack gap="space-20">
        <Heading level="2" size="large" ref={headingRef} tabIndex={-1} className="decision-heading">
          Kvotevisualisering
        </Heading>

        <LocalAlert status="info" role="note" as="div">
          <LocalAlert.Content>
            {kvoter
              ? 'Kvoteplanen vises som en Aksel-basert fordelingslinje med tabell som kontrollgrunnlag.'
              : 'Kvote beregnes bare for innvilgede foreldrepenger.'}
          </LocalAlert.Content>
        </LocalAlert>

        {kvoter && <KvoteFordeling kvoter={kvoter} />}

        {shouldShowManualDecision(sak) && (
          <ManuellBeslutningPanel sak={sak} onDecisionSaved={handleSakChange} />
        )}
      </VStack>
    </Box>
  );
}
