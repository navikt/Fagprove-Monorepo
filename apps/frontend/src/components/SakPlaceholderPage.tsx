import { BodyLong, Button, Heading, VStack } from '@navikt/ds-react';
import { PageContainer } from './layout/PageContainer';
import { SectionCard } from './layout/SectionCard';

interface SakPlaceholderPageProps {
  sakId: string;
}

export function SakPlaceholderPage({ sakId }: SakPlaceholderPageProps) {
  return (
    <PageContainer>
      <VStack gap="space-8">
        <Heading level="1" size="xlarge">
          Sak {sakId}
        </Heading>
        <BodyLong>
          Behandlingen er startet. Full saksvisning med regelspor, vedtak og kvotefordeling bygges i
          neste steg.
        </BodyLong>
      </VStack>

      <SectionCard title="Saksvisning kommer senere">
        <VStack gap="space-16" align="start">
          <BodyLong>
            Denne siden tar vare på ruten som søknadslisten navigerer til etter at backend har
            opprettet eller hentet saken.
          </BodyLong>
          <Button as="a" href="/" variant="secondary">
            Tilbake til søknadslisten
          </Button>
        </VStack>
      </SectionCard>
    </PageContainer>
  );
}
