import { BodyShort, Box, Heading, Link, List, VStack } from '@navikt/ds-react';

export function NotFoundPage() {
  return (
    <Box paddingBlock="space-32 space-24" data-aksel-template="404-v3">
      <VStack gap="space-16">
        <Heading level="1" size="large">
          Beklager, vi fant ikke siden
        </Heading>
        <BodyShort>
          Denne siden kan være slettet eller flyttet, eller det er en feil i lenken.
        </BodyShort>
        <List>
          <List.Item>Bruk gjerne søket eller menyen</List.Item>
          <List.Item>
            <Link href="/">Gå til forsiden</Link>
          </List.Item>
        </List>
      </VStack>
    </Box>
  );
}
