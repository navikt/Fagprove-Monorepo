import { BodyLong, BodyShort, Box, Heading, HGrid, VStack } from '@navikt/ds-react';
import { DemoViewToggle } from './DemoViewToggle';
import { PageContainer } from './layout/PageContainer';
import { SectionCard } from './layout/SectionCard';

const flowSections = [
  'Saksdata',
  'Regelspor',
  'Vedtak og behandling',
  'Kvotevisualisering',
  'Intern oppfølging',
  'Teamlederoversikt',
];

export function VelgSoknadPage() {
  return (
    <PageContainer>
      <DemoViewToggle />

      <VStack gap="space-8">
        <Heading level="1" size="xlarge">
          Velg søknad
        </Heading>
        <BodyLong>
          Her starter saksbehandlers arbeidsliste for foreldrepenger. Velg en søknad for å behandle
          saken videre når søknadslisten kobles til API-et.
        </BodyLong>
      </VStack>

      <SectionCard
        title="Mine søknader"
        description="Arbeidslisten skal vise søknader som er klare for behandling."
      >
        <Box padding="space-24" className="empty-state">
          <VStack gap="space-8">
            <Heading level="3" size="small">
              Ingen søknader er lastet inn ennå
            </Heading>
            <BodyShort>
              Søknadslisten kobles til `/api/v1/foreldrepenger/soknader` i neste frontend-steg.
            </BodyShort>
          </VStack>
        </Box>
      </SectionCard>

      <SectionCard
        title="Saksflyt"
        description="Base-layouten har faste seksjoner som senere sider kan fylle med saksdetaljer."
      >
        <HGrid gap="space-16" columns={{ xs: 1, md: 2, lg: 3 }}>
          {flowSections.map((section) => (
            <Box key={section} padding="space-16" className="empty-state flow-slot">
              <BodyShort weight="semibold">{section}</BodyShort>
            </Box>
          ))}
        </HGrid>
      </SectionCard>
    </PageContainer>
  );
}
