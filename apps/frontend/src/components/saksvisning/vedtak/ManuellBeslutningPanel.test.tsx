import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, vi } from 'vitest';
import {
  manuellBeslutningApiPath,
  type ManuellBeslutningRequest,
} from '../../../lib/foreldrepenger';
import {
  seedManuellVurderingSakResponse,
  createManualDecisionSakResponse,
} from '../../../mocks/foreldrepenger-seed';
import { server } from '../../../../test/setup';
import { ManuellBeslutningPanel } from './ManuellBeslutningPanel';

describe('ManuellBeslutningPanel', () => {
  it('shows validation error when begrunnelse is empty', async () => {
    const user = userEvent.setup();
    render(
      <ManuellBeslutningPanel sak={seedManuellVurderingSakResponse} onDecisionSaved={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: 'Innvilg manuelt' }));

    expect(
      screen.getByText('Begrunnelse må fylles ut før du kan fatte manuelt vedtak.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Saksbehandlers begrunnelse')).toHaveFocus();
  });

  it.each<[string, 'INNVILGELSE' | 'AVSLAG']>([
    ['Innvilg manuelt', 'INNVILGELSE'],
    ['Avslå manuelt', 'AVSLAG'],
  ])('sends correct payload when clicking %s', async (buttonName, expectedType) => {
    const user = userEvent.setup();
    let received: ManuellBeslutningRequest | undefined;
    server.use(
      http.post(manuellBeslutningApiPath('1004'), async ({ request }) => {
        received = (await request.json()) as ManuellBeslutningRequest;
        return HttpResponse.json(
          createManualDecisionSakResponse(
            received.type,
            received.begrunnelse,
            received.besluttetAv,
          ),
        );
      }),
    );
    render(
      <ManuellBeslutningPanel sak={seedManuellVurderingSakResponse} onDecisionSaved={vi.fn()} />,
    );

    await user.type(screen.getByLabelText('Saksbehandlers begrunnelse'), '  Kontrollert.  ');
    await user.click(screen.getByRole('button', { name: buttonName }));

    await waitFor(() =>
      expect(received).toEqual({
        type: expectedType,
        begrunnelse: 'Kontrollert.',
        besluttetAv: 'Kari Saksbehandler',
      }),
    );
  });

  it('calls onDecisionSaved with updated sak on success', async () => {
    const user = userEvent.setup();
    const onDecisionSaved = vi.fn();
    render(
      <ManuellBeslutningPanel
        sak={seedManuellVurderingSakResponse}
        onDecisionSaved={onDecisionSaved}
      />,
    );

    await user.type(screen.getByLabelText('Saksbehandlers begrunnelse'), 'Grunnlaget er OK.');
    await user.click(screen.getByRole('button', { name: 'Innvilg manuelt' }));

    await waitFor(() => expect(onDecisionSaved).toHaveBeenCalledOnce());
    const savedSak = onDecisionSaved.mock.calls[0][0];
    expect(savedSak.status).toBe('FERDIGSTILT');
    expect(savedSak.vedtak?.variant).toBe('INNVILGET');
  });

  it('shows error alert when submission fails', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(manuellBeslutningApiPath('1004'), () =>
        HttpResponse.json({ detail: 'Backend utilgjengelig' }, { status: 503 }),
      ),
    );
    render(
      <ManuellBeslutningPanel sak={seedManuellVurderingSakResponse} onDecisionSaved={vi.fn()} />,
    );

    await user.type(screen.getByLabelText('Saksbehandlers begrunnelse'), 'Test.');
    await user.click(screen.getByRole('button', { name: 'Avslå manuelt' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Kunne ikke lagre manuell beslutning',
    );
    expect(screen.getByText('Backend utilgjengelig')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Avslå manuelt' })).toBeEnabled();
  });
});
