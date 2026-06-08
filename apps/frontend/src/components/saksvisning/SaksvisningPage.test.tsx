import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { SAKER_API_PATH } from '../../lib/foreldrepenger';
import { server } from '../../../test/setup';
import { SaksvisningPage } from './SaksvisningPage';

describe('SaksvisningPage', () => {
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

  it('shows internal follow-up in its own tab and a complicated tag in the header', async () => {
    const user = userEvent.setup();
    render(<SaksvisningPage sakId="1001" />);

    await screen.findByRole('heading', { level: 1, name: 'FP-001 · Ingrid Hansen' });
    expect((await screen.findAllByText('Komplisert sak')).length).toBeGreaterThan(0);

    await user.click(await screen.findByRole('tab', { name: /Intern oppfølging/ }));

    const heading = await screen.findByRole('heading', { level: 2, name: 'Intern oppfølging' });
    const panel = heading.closest('section');
    if (!panel) throw new Error('Fant ikke intern oppfølging-panelet');
    expect(panel).toHaveTextContent(/kun til internt bruk i Nav/);
    expect(panel).toHaveTextContent('Lagret intern merknad');
  });
});
