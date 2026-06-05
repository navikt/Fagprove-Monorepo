import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { internMerknadApiPath, type InternMerknad } from '../../lib/foreldrepenger';
import { server } from '../../../test/setup';
import { InternOppfolgingPanel } from './InternOppfolgingPanel';

const lagretMerknad: InternMerknad = {
  sakId: 1001,
  komplisert: true,
  kommentar: 'Avklarte kvotefordeling med fagstøtte.',
  oppdatertAv: 'Kari Saksbehandler',
  oppdatertTidspunkt: '2026-06-05T09:12:00Z',
};

const tomMerknad: InternMerknad = {
  sakId: 1001,
  komplisert: false,
  kommentar: '',
  oppdatertAv: null,
  oppdatertTidspunkt: null,
};

function renderPanel(overrides: Partial<React.ComponentProps<typeof InternOppfolgingPanel>> = {}) {
  const onMerknadSaved = vi.fn();
  render(
    <InternOppfolgingPanel
      sakId={1001}
      merknad={tomMerknad}
      loading={false}
      onMerknadSaved={onMerknadSaved}
      {...overrides}
    />,
  );
  return { onMerknadSaved };
}

describe('InternOppfolgingPanel', () => {
  it('always shows the internal-only info notice', () => {
    renderPanel();
    expect(
      screen.getByText(/kun til internt bruk i Nav\. Den deles ikke med mor, medmor eller far\./),
    ).toBeInTheDocument();
  });

  it('shows a loading state', () => {
    renderPanel({ loading: true, merknad: undefined });
    expect(screen.getByRole('status')).toHaveTextContent('Henter intern merknad');
  });

  it('shows a load error', () => {
    renderPanel({ loadError: 'Backend nede', merknad: undefined });
    expect(screen.getByRole('alert')).toHaveTextContent('Kunne ikke hente intern merknad');
    expect(screen.getByText('Backend nede')).toBeInTheDocument();
  });

  it('starts in edit mode with an empty form when no merknad is saved', () => {
    renderPanel({ merknad: tomMerknad });

    expect(screen.queryByText('Lagret intern merknad')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lagre merknad' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rediger merknad' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Intern kommentar')).toHaveValue('');
    expect(screen.getByLabelText('Intern kommentar')).toBeEnabled();
  });

  it('shows a read-only view with the saved comment and a complicated tag', () => {
    renderPanel({ merknad: lagretMerknad });

    const card = screen.getByText('Lagret intern merknad').closest('section, div');
    expect(card).not.toBeNull();
    expect(screen.getByText('Avklarte kvotefordeling med fagstøtte.')).toBeInTheDocument();
    expect(screen.getByText(/Oppdatert av Kari Saksbehandler/)).toBeInTheDocument();
    expect(screen.getAllByText('Komplisert sak').length).toBeGreaterThan(0);

    const checkbox = screen.getByRole('checkbox', {
      name: 'Marker saken som komplisert eller utfordrende',
    });
    expect(checkbox).toBeChecked();
    expect(checkbox).toBeDisabled();
    // Comment lives in the card; the textarea is empty until editing.
    expect(screen.getByLabelText('Intern kommentar')).toHaveValue('');
    expect(screen.getByLabelText('Intern kommentar')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Rediger merknad' })).toBeInTheDocument();
  });

  it('prefills the textarea when entering edit mode', async () => {
    const user = userEvent.setup();
    renderPanel({ merknad: lagretMerknad });

    await user.click(screen.getByRole('button', { name: 'Rediger merknad' }));

    expect(screen.getByLabelText('Intern kommentar')).toHaveValue(
      'Avklarte kvotefordeling med fagstøtte.',
    );
    expect(screen.getByRole('button', { name: 'Lagre merknad' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Avbryt' })).toBeInTheDocument();
  });

  it('validates that a complicated case requires a comment', async () => {
    const user = userEvent.setup();
    const { onMerknadSaved } = renderPanel({ merknad: tomMerknad });

    await user.click(
      screen.getByRole('checkbox', { name: 'Marker saken som komplisert eller utfordrende' }),
    );
    await user.click(screen.getByRole('button', { name: 'Lagre merknad' }));

    expect(
      screen.getByText('Kommentar må fylles ut når saken markeres som komplisert.'),
    ).toBeInTheDocument();
    expect(onMerknadSaved).not.toHaveBeenCalled();
  });

  it('saves the merknad and reports the saved result', async () => {
    const user = userEvent.setup();
    let receivedBody: unknown;
    server.use(
      http.put(internMerknadApiPath('1001'), async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          sakId: 1001,
          komplisert: true,
          kommentar: 'Ny intern kommentar.',
          oppdatertAv: 'Kari Saksbehandler',
          oppdatertTidspunkt: '2026-06-05T10:00:00Z',
        } satisfies InternMerknad);
      }),
    );
    const { onMerknadSaved } = renderPanel({ merknad: tomMerknad });

    await user.click(
      screen.getByRole('checkbox', { name: 'Marker saken som komplisert eller utfordrende' }),
    );
    await user.type(screen.getByLabelText('Intern kommentar'), 'Ny intern kommentar.');
    await user.click(screen.getByRole('button', { name: 'Lagre merknad' }));

    await waitFor(() =>
      expect(receivedBody).toEqual({
        komplisert: true,
        kommentar: 'Ny intern kommentar.',
        oppdatertAv: 'Kari Saksbehandler',
      }),
    );
    expect(onMerknadSaved).toHaveBeenCalledWith(
      expect.objectContaining({ kommentar: 'Ny intern kommentar.', komplisert: true }),
    );
  });

  it('shows a safe error when saving fails', async () => {
    const user = userEvent.setup();
    server.use(
      http.put(internMerknadApiPath('1001'), () =>
        HttpResponse.json({ detail: 'Backend utilgjengelig' }, { status: 503 }),
      ),
    );
    renderPanel({ merknad: tomMerknad });

    await user.type(screen.getByLabelText('Intern kommentar'), 'Notat uten markering.');
    await user.click(screen.getByRole('button', { name: 'Lagre merknad' }));

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('Kunne ikke lagre intern merknad')).toBeInTheDocument();
    expect(screen.getByText('Backend utilgjengelig')).toBeInTheDocument();
  });
});
