import { Heading, BodyLong, Box } from '@navikt/ds-react';

interface Props {
  heading: string;
  body: string;
}

export function WelcomeCard({ heading, body }: Props) {
  return (
    <Box>
      <Heading level="1" size="xlarge" spacing>
        {heading}
      </Heading>
      <BodyLong spacing>{body}</BodyLong>
    </Box>
  );
}
