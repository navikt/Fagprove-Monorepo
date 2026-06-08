import { Component, type ErrorInfo, type ReactNode } from 'react';
import { LocalAlert, Button, VStack, Box } from '@navikt/ds-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught render error', {
        name: error.name,
        message: error.message,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <VStack gap="space-16">
          <LocalAlert status="error" role="alert" as="div">
            <LocalAlert.Header>
              <LocalAlert.Title as="div">Noe gikk galt. Prøv igjen senere.</LocalAlert.Title>
            </LocalAlert.Header>
          </LocalAlert>
          <Box>
            <Button variant="secondary" size="small" onClick={this.handleRetry}>
              Prøv igjen
            </Button>
          </Box>
        </VStack>
      );
    }

    return this.props.children;
  }
}
