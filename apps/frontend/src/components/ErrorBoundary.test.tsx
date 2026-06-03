import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div data-testid="child-content">Alt fungerer</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('child-content')).toHaveTextContent('Alt fungerer');
  });

  it('shows error alert when child throws', () => {
    // Suppress React error boundary console.error in test output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Noe gikk galt. Prøv igjen senere.');
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();

    spy.mockRestore();
  });

  it('recovers when retry button is clicked', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;

    function ConditionalThrower() {
      if (shouldThrow) throw new Error('Test error');
      return <div data-testid="child-content">Recovered</div>;
    }

    render(
      <ErrorBoundary>
        <ConditionalThrower />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Fix the error condition before retrying
    shouldThrow = false;
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Prøv igjen' }));

    expect(screen.getByTestId('child-content')).toHaveTextContent('Recovered');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    spy.mockRestore();
  });
});
