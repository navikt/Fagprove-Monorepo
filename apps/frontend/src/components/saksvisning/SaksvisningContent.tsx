import { Box, Link, Tabs, VStack } from '@navikt/ds-react';
import { type SakResponse } from '../../lib/foreldrepenger';
import { CaseHeader } from './CaseHeader';
import { Kvotevisualisering } from './Kvotevisualisering';
import { RegelsporPanel } from './RegelsporPanel';
import { SaksdataPanel } from './SaksdataPanel';
import { VedtakPanel } from './VedtakPanel';
import './Saksvisning.css';

interface SaksvisningContentProps {
  sak: SakResponse;
  onSakChange: (sak: SakResponse) => void;
}

export function SaksvisningContent({ sak, onSakChange }: SaksvisningContentProps) {
  return (
    <VStack gap="space-24">
      <Link href="/">← Tilbake til søknader</Link>

      <CaseHeader sak={sak} />

      <Tabs defaultValue="regelspor">
        <Tabs.List>
          <Tabs.Tab
            value="regelspor"
            label={
              <span>
                <span aria-hidden="true">▦ </span>Regelspor
              </span>
            }
          />
          <Tabs.Tab
            value="vedtak"
            label={
              <span>
                <span aria-hidden="true">▧ </span>Vedtak
              </span>
            }
          />
        </Tabs.List>

        <Tabs.Panel value="regelspor">
          <Box paddingBlock="space-0">
            <div className="case-detail-grid">
              <RegelsporPanel sak={sak} />
              <SaksdataPanel sak={sak} />
            </div>
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="vedtak">
          <Box paddingBlock="space-24 0">
            <div className="decision-detail-grid">
              <VedtakPanel sak={sak} />
              <Kvotevisualisering kvoter={sak.vedtak?.kvoter} sak={sak} onSakChange={onSakChange} />
            </div>
          </Box>
        </Tabs.Panel>
      </Tabs>
    </VStack>
  );
}
