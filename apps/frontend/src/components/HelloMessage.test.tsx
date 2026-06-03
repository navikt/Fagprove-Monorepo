import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/setup';
import { HelloMessage } from './HelloMessage';

describe('HelloMessage', () => {
  it('renders button in idle state', () => {
    render(<HelloMessage />);

    expect(screen.getByRole('button', { name: 'Hent hilsen' })).toBeInTheDocument();
    expect(screen.queryByTestId('hello-message')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows loading state when fetching', async () => {
    server.use(
      http.get('/api/hello', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({ message: 'Hello!' });
      }),
    );

    render(<HelloMessage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Hent hilsen' }));

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('shows success message after successful fetch', async () => {
    server.use(
      http.get('/api/hello', () => {
        return HttpResponse.json({ message: 'Hei fra serveren!' });
      }),
    );

    render(<HelloMessage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Hent hilsen' }));

    await waitFor(() => {
      expect(screen.getByTestId('hello-message')).toHaveTextContent('Hei fra serveren!');
    });
  });

  it('shows error alert on HTTP error', async () => {
    server.use(
      http.get('/api/hello', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    render(<HelloMessage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Hent hilsen' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Kunne ikke hente hilsen. Prøv igjen senere.',
      );
    });
  });

  it('shows error alert on network failure', async () => {
    server.use(
      http.get('/api/hello', () => {
        return HttpResponse.error();
      }),
    );

    render(<HelloMessage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Hent hilsen' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Kunne ikke hente hilsen. Prøv igjen senere.',
      );
    });
  });

  it('has aria-live region for dynamic content', () => {
    render(<HelloMessage />);

    const liveRegion = screen
      .getByRole('button', { name: 'Hent hilsen' })
      .parentElement?.querySelector('[aria-live]');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });

  it('can retry after error', async () => {
    server.use(
      http.get('/api/hello', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    render(<HelloMessage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Hent hilsen' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Now set up success response for retry
    server.use(
      http.get('/api/hello', () => {
        return HttpResponse.json({ message: 'Retry success!' });
      }),
    );

    await user.click(screen.getByRole('button', { name: 'Hent hilsen' }));
    await waitFor(() => {
      expect(screen.getByTestId('hello-message')).toHaveTextContent('Retry success!');
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
