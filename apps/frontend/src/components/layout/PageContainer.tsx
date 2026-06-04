import type { ReactNode } from 'react';
import { Box, VStack } from '@navikt/ds-react';

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <Box className="page-container">
      <VStack gap="space-24">{children}</VStack>
    </Box>
  );
}
