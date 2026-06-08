import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { INTERNE_MERKNADER_API_PATH } from '../../lib/foreldrepenger';
import { server } from '../../../test/setup';
import { TeamlederOversiktPage } from './TeamlederOversiktPage';

describe('TeamlederOversiktPage', () => {
  it('renders heading and explanatory copy', () => {
    render(<TeamlederOversiktPage onNavigate={vi.fn()} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Saker med intern oppfølging' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Oversikt over kompliserte saker' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Teamledervisningen viser bare saker som er markert med intern oppfølging.'),
    ).toBeInTheDocument();
  });

  it('shows a loading state while fetching', () => {
    render(<TeamlederOversiktPage onNavigate={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('Henter interne merknader');
  });

  it('renders the complicated cases and navigates when opening one', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<TeamlederOversiktPage onNavigate={onNavigate} />);

    const row = await screen.findByRole('row', { name: /FP-001/ });
    expect(within(row).getByText('TEST-0001')).toBeInTheDocument();
    expect(within(row).getByText('Komplisert sak')).toBeInTheDocument();
    expect(within(row).getByText(/Avklarte kvotefordeling/)).toBeInTheDocument();
    expect(within(row).getByText('Kari Saksbehandler')).toBeInTheDocument();

    await user.click(within(row).getByRole('button', { name: 'Åpne sak' }));
    expect(onNavigate).toHaveBeenCalledWith('/saker/1001');
  });

  it('shows an empty state when no cases are flagged', async () => {
    server.use(http.get(INTERNE_MERKNADER_API_PATH, () => HttpResponse.json({ saker: [] })));
    render(<TeamlederOversiktPage onNavigate={vi.fn()} />);

    expect(await screen.findByText('Ingen saker med intern oppfølging')).toBeInTheDocument();
  });

  it('shows an understandable error state when the list cannot be fetched', async () => {
    server.use(
      http.get(INTERNE_MERKNADER_API_PATH, () =>
        HttpResponse.json({ detail: 'Backend utilgjengelig' }, { status: 503 }),
      ),
    );
    render(<TeamlederOversiktPage onNavigate={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Kunne ikke hente interne merknader',
    );
    expect(screen.getByText('Backend utilgjengelig')).toBeInTheDocument();
  });
});
