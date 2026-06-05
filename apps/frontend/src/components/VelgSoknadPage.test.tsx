import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { SOKNADER_API_PATH, VEDTAK_API_PATH, DEMO_RESET_API_PATH } from '../lib/foreldrepenger';
import { seedSoknaderResponse } from '../mocks/foreldrepenger-seed';
import { server } from '../../test/setup';
import { VelgSoknadPage } from './VelgSoknadPage';

describe('VelgSoknadPage', () => {
  it('renders the caseworker landing content and application list', async () => {
    render(<VelgSoknadPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Velg søknad' })).toBeInTheDocument();
    expect(screen.getByText(/saksbehandlers arbeidsliste/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Mine søknader' })).toBeInTheDocument();
    expect(screen.getByText('Demovalg - ikke tilgangsstyring')).toBeInTheDocument();
    expect(await screen.findByRole('columnheader', { name: 'Sak' })).toBeInTheDocument();
    expect(screen.getByText('FP-001')).toBeInTheDocument();
    expect(screen.getByText('TEST-0001')).toBeInTheDocument();
    expect(screen.getByText(/Standard innvilgelse/)).toBeInTheDocument();
    expect(screen.queryByText('00000000001')).not.toBeInTheDocument();
  });

  it('keeps the demo view toggle keyboard and pointer operable', async () => {
    render(<VelgSoknadPage />);
    const user = userEvent.setup();

    const teamleder = screen.getByRole('radio', { name: 'Teamleder' });
    await user.click(teamleder);

    expect(teamleder).toHaveAttribute('aria-checked', 'true');
  });

  it('shows a loading state while fetching applications', () => {
    render(<VelgSoknadPage />);

    expect(screen.getByRole('status')).toHaveTextContent('Henter søknader');
  });

  it('shows an understandable error state when the list cannot be fetched', async () => {
    server.use(
      http.get(SOKNADER_API_PATH, () =>
        HttpResponse.json({ detail: 'Backend utilgjengelig' }, { status: 503 }),
      ),
    );

    render(<VelgSoknadPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Kunne ikke hente søknader');
    expect(screen.getByText('Backend utilgjengelig')).toBeInTheDocument();
  });

  it('shows an empty state when there are no applications', async () => {
    server.use(http.get(SOKNADER_API_PATH, () => HttpResponse.json({ soknader: [] })));

    render(<VelgSoknadPage />);

    expect(await screen.findByText('Ingen søknader i arbeidslisten')).toBeInTheDocument();
    expect(screen.getByText(/ingen testsøknader/i)).toBeInTheDocument();
  });

  it('starts treatment and navigates to the returned case route', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<VelgSoknadPage onNavigate={onNavigate} />);

    const firstRow = await screen.findByRole('row', { name: /FP-001/ });
    await user.click(within(firstRow).getByRole('button', { name: 'Åpne sak' }));

    expect(onNavigate).toHaveBeenCalledWith('/saker/1001');
  });

  it('shows an error if opening a case fails', async () => {
    server.use(
      http.post(VEDTAK_API_PATH, () =>
        HttpResponse.json({ detail: 'Søknaden finnes ikke' }, { status: 404 }),
      ),
    );
    const user = userEvent.setup();

    render(<VelgSoknadPage />);

    const firstRow = await screen.findByRole('row', { name: /FP-001/ });
    await user.click(within(firstRow).getByRole('button', { name: 'Åpne sak' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Søknaden finnes ikke');
  });

  it('shows a safe tag for complicated applications without rendering comments', async () => {
    server.use(
      http.get(SOKNADER_API_PATH, () =>
        HttpResponse.json({
          soknader: [
            {
              ...seedSoknaderResponse.soknader[0],
              komplisert: true,
              kommentar: 'Skal ikke vises i listen',
            },
          ],
        }),
      ),
    );

    render(<VelgSoknadPage />);

    expect(await screen.findByText('Komplisert sak')).toBeInTheDocument();
    expect(screen.queryByText('Skal ikke vises i listen')).not.toBeInTheDocument();
  });

  it('asks for confirmation before resetting demo data', async () => {
    const user = userEvent.setup();
    render(<VelgSoknadPage />);

    await screen.findByText('FP-001');
    await user.click(screen.getByRole('button', { name: 'Tilbakestill demodata' }));

    expect(screen.getByRole('button', { name: 'Bekreft nullstilling' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Avbryt' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Avbryt' }));
    expect(screen.queryByRole('button', { name: 'Bekreft nullstilling' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tilbakestill demodata' })).toBeInTheDocument();
  });

  it('resets demo data and refreshes the application list on confirmation', async () => {
    let resetCalls = 0;
    server.use(
      http.post(DEMO_RESET_API_PATH, () => {
        resetCalls += 1;
        return HttpResponse.json({ antallSoknader: 5 });
      }),
    );

    const user = userEvent.setup();
    render(<VelgSoknadPage />);

    await screen.findByText('FP-001');
    await user.click(screen.getByRole('button', { name: 'Tilbakestill demodata' }));
    await user.click(screen.getByRole('button', { name: 'Bekreft nullstilling' }));

    expect(await screen.findByText(/Demodata er tilbakestilt\. 5/)).toBeInTheDocument();
    expect(resetCalls).toBe(1);
    expect(screen.getByText('FP-001')).toBeInTheDocument();
  });

  it('shows an error if resetting demo data fails', async () => {
    server.use(
      http.post(DEMO_RESET_API_PATH, () =>
        HttpResponse.json({ detail: 'Demo-nullstilling er deaktivert' }, { status: 404 }),
      ),
    );

    const user = userEvent.setup();
    render(<VelgSoknadPage />);

    await screen.findByText('FP-001');
    await user.click(screen.getByRole('button', { name: 'Tilbakestill demodata' }));
    await user.click(screen.getByRole('button', { name: 'Bekreft nullstilling' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Demo-nullstilling er deaktivert');
  });
});
