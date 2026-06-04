import { render, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { SAKER_API_PATH } from '../lib/foreldrepenger';
import { server } from '../../test/setup';
import { SaksvisningPage } from './SaksvisningPage';

describe('SaksvisningPage', () => {
  it('renders rule trace steps from backend', async () => {
    render(<SaksvisningPage sakId="1001" />);

    expect(await screen.findByRole('heading', { level: 1, name: 'FP-001' })).toBeInTheDocument();
    expect(screen.getByText('Innvilget')).toBeInTheDocument();
    expect(screen.getByText('Standard innvilgelse · Søker TEST-0001')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Regelspor' })).toBeInTheDocument();
    expect(screen.getByText('Opptjening')).toBeInTheDocument();
    expect(screen.getByText('Beregningsgrunnlag')).toBeInTheDocument();
    expect(screen.getByText('Stønadsperiode')).toBeInTheDocument();
    expect(screen.getByText('Kvotefordeling')).toBeInTheDocument();
    expect(screen.getByText(/Beregningsgrunnlag er 648000 kr/)).toBeInTheDocument();
  });

  it('renders case data and income history', async () => {
    render(<SaksvisningPage sakId="1001" />);

    const saksdataHeading = await screen.findByRole('heading', { name: 'Saksdata' });
    const saksdataPanel = saksdataHeading.closest('section');
    if (!saksdataPanel) {
      throw new Error('Fant ikke saksdata-panelet');
    }

    expect(screen.getByText('Personident')).toBeInTheDocument();
    expect(screen.getByText('TEST-0001')).toBeInTheDocument();
    expect(screen.getByText('Termindato')).toBeInTheDocument();
    expect(screen.getByText('01.08.2026')).toBeInTheDocument();
    expect(screen.getByText('Oppgitt årsinntekt')).toBeInTheDocument();
    expect(within(saksdataPanel).getByText(/648\s*000 kr/)).toBeInTheDocument();

    const incomeTable = screen.getByRole('table', { name: 'Inntektshistorikk' });
    expect(within(incomeTable).getByRole('columnheader', { name: 'Måned' })).toBeInTheDocument();
    expect(
      within(incomeTable).getByRole('row', { name: /01\.2026 Arbeid 47\s*000 kr/ }),
    ).toBeInTheDocument();
    expect(
      within(incomeTable).getByRole('row', { name: /05\.2026 Foreldrepenger 56\s*000 kr/ }),
    ).toBeInTheDocument();
  });

  it('clearly renders manual assessment as pending and not a final decision', async () => {
    render(<SaksvisningPage sakId="1004" />);

    expect(await screen.findByRole('heading', { level: 1, name: 'FP-004' })).toBeInTheDocument();
    expect(screen.getAllByText('Manuell vurdering').length).toBeGreaterThan(0);
    expect(screen.getByRole('status')).toHaveTextContent('Venter på manuell vurdering');
    expect(screen.getByRole('status')).toHaveTextContent('Dette er ikke et ferdig vedtak');
    expect(screen.getByText(/avviker mer enn 25 %/)).toBeInTheDocument();
  });

  it('shows a loading state while fetching case details', () => {
    render(<SaksvisningPage sakId="1001" />);

    expect(screen.getByRole('status')).toHaveTextContent('Henter sak');
  });

  it('shows not found when the case does not exist', async () => {
    render(<SaksvisningPage sakId="9999" />);

    expect(
      await screen.findByRole('heading', { name: 'Beklager, vi fant ikke siden' }),
    ).toBeInTheDocument();
  });

  it('shows an understandable error state when case details cannot be fetched', async () => {
    server.use(
      http.get(`${SAKER_API_PATH}/:id`, () =>
        HttpResponse.json({ detail: 'Backend utilgjengelig' }, { status: 503 }),
      ),
    );

    render(<SaksvisningPage sakId="1001" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Kunne ikke hente saken');
    expect(screen.getByText('Backend utilgjengelig')).toBeInTheDocument();
  });
});
