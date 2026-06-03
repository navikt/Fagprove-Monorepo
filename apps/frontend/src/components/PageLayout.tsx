import { Page, Box } from '@navikt/ds-react';
import './PageLayout.css';

interface Props {
  children: React.ReactNode;
  decoratorHeader?: string;
  decoratorFooter?: string;
}

export function PageLayout({ children, decoratorHeader, decoratorFooter }: Props) {
  return (
    <Page
      footer={decoratorFooter ? <TrustedDecoratorHtml html={decoratorFooter} /> : undefined}
      footerPosition="belowFold"
    >
      <a href="#main-content" className="skip-link">
        Hopp til hovedinnhold
      </a>
      {decoratorHeader && <TrustedDecoratorHtml html={decoratorHeader} />}
      <Page.Block as="main" width="xl" gutters id="main-content">
        <Box paddingBlock="space-20 space-16">{children}</Box>
      </Page.Block>
    </Page>
  );
}

function TrustedDecoratorHtml({ html }: { html: string }) {
  // Nav-dekoratoren returns trusted first-party HTML; never pass user-provided content here.
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
