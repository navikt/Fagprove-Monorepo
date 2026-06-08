import { useEffect, useState } from 'react';
import { Box, Link, Tabs, VStack } from '@navikt/ds-react';
import { ExclamationmarkTriangleIcon, GavelIcon, TasklistIcon } from '@navikt/aksel-icons';
import {
  ApiClientError,
  hentInternMerknad,
  type InternMerknad,
  type SakResponse,
} from '../../lib/foreldrepenger';
import { CaseHeader } from './CaseHeader';
import { InternOppfolgingPanel } from './intern-oppfolging/InternOppfolgingPanel';
import { Kvotevisualisering } from './vedtak/Kvotevisualisering';
import { RegelsporPanel } from './regelspor/RegelsporPanel';
import { SaksdataPanel } from './saksdata/SaksdataPanel';
import { VedtakPanel } from './vedtak/VedtakPanel';
import './Saksvisning.css';

interface SaksvisningContentProps {
  sak: SakResponse;
  onSakChange: (sak: SakResponse) => void;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError || error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export function SaksvisningContent({ sak, onSakChange }: SaksvisningContentProps) {
  const [internMerknad, setInternMerknad] = useState<InternMerknad>();
  const [merknadLoading, setMerknadLoading] = useState(true);
  const [merknadError, setMerknadError] = useState<string>();

  useEffect(() => {
    let active = true;
    setMerknadLoading(true);
    setMerknadError(undefined);

    hentInternMerknad(sak.sakId)
      .then((merknad) => {
        if (active) {
          setInternMerknad(merknad);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setInternMerknad(undefined);
          setMerknadError(getErrorMessage(error, 'Kunne ikke hente intern merknad.'));
        }
      })
      .finally(() => {
        if (active) {
          setMerknadLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [sak.sakId]);

  return (
    <VStack gap="space-24">
      <Link href="/">← Tilbake til søknader</Link>

      <CaseHeader sak={sak} komplisert={internMerknad?.komplisert ?? false} />

      <Tabs defaultValue="regelspor">
        <Tabs.List>
          <Tabs.Tab value="regelspor" label="Regelspor" icon={<TasklistIcon aria-hidden />} />
          <Tabs.Tab value="vedtak" label="Vedtak" icon={<GavelIcon aria-hidden />} />
          <Tabs.Tab
            value="intern-oppfolging"
            label="Intern oppfølging"
            icon={<ExclamationmarkTriangleIcon aria-hidden />}
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

        <Tabs.Panel value="intern-oppfolging">
          <Box paddingBlock="space-24 0">
            <InternOppfolgingPanel
              sakId={sak.sakId}
              merknad={internMerknad}
              loading={merknadLoading}
              loadError={merknadError}
              onMerknadSaved={setInternMerknad}
            />
          </Box>
        </Tabs.Panel>
      </Tabs>
    </VStack>
  );
}
