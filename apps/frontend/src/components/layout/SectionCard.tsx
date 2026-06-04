import type { ReactNode } from 'react';
import { BodyShort, Box, Heading, VStack } from '@navikt/ds-react';

interface SectionCardProps {
  title: string;
  description?: string;
  children?: ReactNode;
  headingLevel?: '2' | '3';
  className?: string;
}

export function SectionCard({
  title,
  description,
  children,
  headingLevel = '2',
  className,
}: SectionCardProps) {
  return (
    <Box
      as="section"
      padding="space-24"
      className={['section-card', className].filter(Boolean).join(' ')}
    >
      <VStack gap="space-16">
        <VStack gap="space-8">
          <Heading level={headingLevel} size={headingLevel === '2' ? 'medium' : 'small'}>
            {title}
          </Heading>
          {description && <BodyShort>{description}</BodyShort>}
        </VStack>
        {children}
      </VStack>
    </Box>
  );
}
