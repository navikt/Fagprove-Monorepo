import { BodyShort, Box, Heading, Link, List, VStack } from '@navikt/ds-react';

export function ServerErrorPage() {
  return (
    <Box paddingBlock="space-32 space-24" data-aksel-template="500-v2">
      <VStack gap="space-16">
        <Heading level="1" size="large">
          Beklager, noe gikk galt
        </Heading>
        <BodyShort>
          En teknisk feil på våre servere gjør at siden er utilgjengelig. Dette skyldes ikke noe du
          gjorde.
        </BodyShort>
        <List>
          <List.Item>Prøv igjen om noen minutter</List.Item>
          <List.Item>
            Hvis feilen vedvarer, kan du <Link href="https://nav.no/kontaktoss">kontakte oss</Link>
          </List.Item>
          <List.Item>
            <Link href="/">Gå til forsiden</Link>
          </List.Item>
        </List>
      </VStack>
    </Box>
  );
}
