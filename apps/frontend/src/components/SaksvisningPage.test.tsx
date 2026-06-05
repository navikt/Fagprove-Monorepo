import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import {
  manuellBeslutningApiPath,
  SAKER_API_PATH,
  type ManuellBeslutningRequest,
  type ManuellBeslutningType,
} from '../lib/foreldrepenger';
import { server } from '../../test/setup';
import { createManualDecisionSakResponse } from '../mocks/foreldrepenger-seed';
import { SaksvisningPage } from './SaksvisningPage';

describe('SaksvisningPage', () => {
  async function openVedtakTab() {
    const user = userEvent.setup();
    await user.click(await screen.findByRole('tab', { name: 'Vedtak' }));
    const heading = await screen.findByRole('heading', { name: 'Vedtak og beregning' });
    const panel = heading.closest('section');
    if (!panel) {
      throw new Error('Fant ikke vedtak-panelet');
    }
    return panel;
  }

  it('renders rule trace steps from backend', async () => {
    render(<SaksvisningPage sakId="1001" />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'FP-001 · Ingrid Hansen' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Innvilget').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Standard innvilgelse/).length).toBeGreaterThan(0);

    expect(screen.getByRole('heading', { name: 'Regler for FP-001' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Opptjening' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Beregningsgrunnlag' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Stønadsperiode' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Kvote' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Regelspor' })).toHaveTextContent('648000 kr');
  });

  it('renders case data and income history', async () => {
    render(<SaksvisningPage sakId="1001" />);

    const saksdataHeading = await screen.findByRole('heading', { name: 'Saksdata' });
    const saksdataPanel = saksdataHeading.closest('aside');
    if (!saksdataPanel) {
      throw new Error('Fant ikke saksdata-panelet');
    }

    expect(screen.getByText('Søkerident')).toBeInTheDocument();
    expect(screen.getByText('TEST-0001')).toBeInTheDocument();
    expect(screen.getByText('Termindato')).toBeInTheDocument();
    expect(screen.getByText('01.08.2026')).toBeInTheDocument();
    expect(screen.getByText('Oppgitt årsinntekt')).toBeInTheDocument();
    expect(within(saksdataPanel).getByText(/648\s*000 kr/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Inntektshistorikk/ }));
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

    expect(
      await screen.findByRole('heading', { level: 1, name: 'FP-004 · Elin Johansen' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Manuell vurdering').length).toBeGreaterThan(0);
    expect(screen.getByRole('status')).toHaveTextContent('For stort sprik');
    expect(screen.getByText('Ikke fastsatt maskinelt')).toBeInTheDocument();
  });

  it('renders manual decision controls only for cases awaiting manual decision', async () => {
    const { unmount } = render(<SaksvisningPage sakId="1001" />);

    const vedtakPanel = await openVedtakTab();
    expect(
      within(vedtakPanel).queryByRole('button', { name: 'Innvilg manuelt' }),
    ).not.toBeInTheDocument();
    expect(
      within(vedtakPanel).queryByRole('button', { name: 'Avslå manuelt' }),
    ).not.toBeInTheDocument();
    unmount();

    render(<SaksvisningPage sakId="1004" />);
    await openVedtakTab();

    expect(screen.getByRole('button', { name: 'Innvilg manuelt' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Avslå manuelt' })).toBeInTheDocument();
  });

  it('shows manual reason, key rule information and decision controls for manual case', async () => {
    render(<SaksvisningPage sakId="1004" />);

    expect(await screen.findByText('Ikke fastsatt maskinelt')).toBeInTheDocument();

    const vedtakPanel = await openVedtakTab();
    const quotaPanel = screen
      .getByRole('heading', { name: 'Kvotevisualisering' })
      .closest('section');
    if (!quotaPanel) {
      throw new Error('Fant ikke kvotepanelet');
    }

    expect(
      within(vedtakPanel).getAllByText(/For stort sprik mellom tre måneders snitt/).length,
    ).toBeGreaterThan(0);
    expect(within(quotaPanel).getByLabelText('Saksbehandlers begrunnelse')).toBeInTheDocument();
    expect(within(quotaPanel).getByRole('button', { name: 'Innvilg manuelt' })).toBeInTheDocument();
    expect(within(quotaPanel).getByRole('button', { name: 'Avslå manuelt' })).toBeInTheDocument();
  });

  it('shows validation error when begrunnelse is missing', async () => {
    const user = userEvent.setup();
    render(<SaksvisningPage sakId="1004" />);

    await openVedtakTab();
    await user.click(screen.getByRole('button', { name: 'Innvilg manuelt' }));

    expect(
      screen.getByText('Begrunnelse må fylles ut før du kan fatte manuelt vedtak.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Saksbehandlers begrunnelse')).toHaveFocus();
  });

  it.each<[string, ManuellBeslutningType]>([
    ['Innvilg manuelt', 'INNVILGELSE'],
    ['Avslå manuelt', 'AVSLAG'],
  ])('sends expected payload when clicking %s', async (buttonName, expectedType) => {
    const user = userEvent.setup();
    let receivedRequest: ManuellBeslutningRequest | undefined;
    server.use(
      http.post(manuellBeslutningApiPath('1004'), async ({ request }) => {
        receivedRequest = (await request.json()) as ManuellBeslutningRequest;
        return HttpResponse.json(
          createManualDecisionSakResponse(
            receivedRequest.type,
            receivedRequest.begrunnelse,
            receivedRequest.besluttetAv,
          ),
        );
      }),
    );
    render(<SaksvisningPage sakId="1004" />);

    await openVedtakTab();
    await user.type(
      screen.getByLabelText('Saksbehandlers begrunnelse'),
      '  Saksbehandler har kontrollert inntektsgrunnlaget.  ',
    );
    await user.click(screen.getByRole('button', { name: buttonName }));

    await waitFor(() =>
      expect(receivedRequest).toEqual({
        type: expectedType,
        begrunnelse: 'Saksbehandler har kontrollert inntektsgrunnlaget.',
        besluttetAv: 'Kari Saksbehandler',
      }),
    );
  });

  it('updates the view to final vedtak after successful manual decision', async () => {
    const user = userEvent.setup();
    render(<SaksvisningPage sakId="1004" />);

    const vedtakPanel = await openVedtakTab();
    await user.type(
      screen.getByLabelText('Saksbehandlers begrunnelse'),
      'Inntekten er dokumentert.',
    );
    await user.click(screen.getByRole('button', { name: 'Innvilg manuelt' }));

    expect(
      await within(vedtakPanel).findByRole('row', { name: /Vedtaksvariant INNVILGET/ }),
    ).toBeInTheDocument();
    expect(within(vedtakPanel).getByText('Inntekten er dokumentert.')).toBeInTheDocument();
    expect(
      within(vedtakPanel).getByRole('row', { name: /Besluttet av Kari Saksbehandler/ }),
    ).toBeInTheDocument();
    expect(
      within(vedtakPanel).getByRole('row', { name: /Besluttet tidspunkt 15\.06\.2026 kl\. 10:05/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Innvilg manuelt' })).not.toBeInTheDocument();
    expect(screen.getByText('49 uker totalt')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Kvotevisualisering' })).toHaveFocus(),
    );
  });

  it('shows a safe error when manual decision submission fails', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(manuellBeslutningApiPath('1004'), () =>
        HttpResponse.json({ detail: 'Backend utilgjengelig' }, { status: 503 }),
      ),
    );
    render(<SaksvisningPage sakId="1004" />);

    await openVedtakTab();
    await user.type(
      screen.getByLabelText('Saksbehandlers begrunnelse'),
      'Grunnlaget kan ikke godkjennes.',
    );
    await user.click(screen.getByRole('button', { name: 'Avslå manuelt' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Kunne ikke lagre manuell beslutning',
    );
    expect(screen.getByText('Backend utilgjengelig')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Avslå manuelt' })).toBeEnabled();
  });

  it.each<[string, string, RegExp, RegExp | undefined]>([
    ['1001', 'Innvilget'],
    ['1002', 'Avslag'],
    ['1003', 'Engangsstønad'],
    ['1004', 'Manuell vurdering'],
  ])('renders vedtaksvariant %s without crashing', async (sakId, label) => {
    render(<SaksvisningPage sakId={sakId} />);

    const vedtakPanel = await openVedtakTab();

    expect(within(vedtakPanel).getAllByText(label).length).toBeGreaterThan(0);
  });

  it('renders beregning, stønadsperiode and kvoter for innvilget vedtak', async () => {
    render(<SaksvisningPage sakId="1001" />);

    const vedtakPanel = await openVedtakTab();

    expect(
      within(vedtakPanel).getByRole('row', { name: /Beregningsgrunnlag 648\s*000 kr/ }),
    ).toBeInTheDocument();
    expect(
      within(vedtakPanel).getByRole('row', { name: /Stønadsperiode 49 uker/ }),
    ).toBeInTheDocument();

    const quotaPanel = screen
      .getByRole('heading', { name: 'Kvotevisualisering' })
      .closest('section');
    if (!quotaPanel) {
      throw new Error('Fant ikke kvotepanelet');
    }

    expect(within(quotaPanel).getByText('49 uker totalt')).toBeInTheDocument();
    expect(within(quotaPanel).getByText('Forhånd: 3 uker')).toBeInTheDocument();
    expect(within(quotaPanel).getByText('Mor: 15 uker')).toBeInTheDocument();
    expect(within(quotaPanel).getByText('Far: 15 uker')).toBeInTheDocument();
    expect(within(quotaPanel).getByText('Felles: 16 uker')).toBeInTheDocument();
    expect(
      within(quotaPanel).getByRole('row', { name: /Forhåndskvote 3 Mor før termin/ }),
    ).toBeInTheDocument();
    expect(
      within(quotaPanel).getByRole('row', { name: /Mødrekvote 15 Reservert mor/ }),
    ).toBeInTheDocument();
    expect(
      within(quotaPanel).getByRole('row', { name: /Fedrekvote 15 Reservert far/ }),
    ).toBeInTheDocument();
    expect(
      within(quotaPanel).getByRole('row', { name: /Fellesperiode 16 Kan fordeles/ }),
    ).toBeInTheDocument();
  });

  it.each([
    [
      '1002',
      'Opptjeningskravet er ikke oppfylt og søker er ikke norsk borger',
      /Vedtaksvariant AVSLAG/,
      undefined,
    ],
    [
      '1003',
      'Opptjeningskravet er ikke oppfylt, men søker er norsk borger',
      /Vedtaksvariant ENGANGSSTONAD/,
      /Beregningsgrunnlag 92\s*648 kr/,
    ],
  ])(
    'renders begrunnelse for vedtaksvariant %s',
    async (sakId, begrunnelse, variantRow, belopRow) => {
      render(<SaksvisningPage sakId={sakId} />);
      const vedtakPanel = await openVedtakTab();

      expect(within(vedtakPanel).getByText(begrunnelse)).toBeInTheDocument();
      expect(within(vedtakPanel).getByRole('row', { name: variantRow })).toBeInTheDocument();
      if (belopRow) {
        expect(within(vedtakPanel).getByRole('row', { name: belopRow })).toBeInTheDocument();
      }
    },
  );

  it('shows manual assessment as pending in the Vedtak tab', async () => {
    render(<SaksvisningPage sakId="1004" />);

    const vedtakPanel = await openVedtakTab();

    expect(within(vedtakPanel).getAllByText('Manuell vurdering').length).toBeGreaterThan(0);
    expect(
      within(vedtakPanel).getByText('Saken må behandles manuelt før endelig vedtak kan fattes.'),
    ).toBeInTheDocument();
    expect(
      within(vedtakPanel).getByRole('row', { name: /Vedtaksvariant MANUELL_VURDERING/ }),
    ).toBeInTheDocument();
    expect(
      within(vedtakPanel).getByRole('row', { name: /Beregningsgrunnlag —/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Kvote beregnes bare for innvilgede foreldrepenger.'),
    ).toBeInTheDocument();
  });

  it('shows internal follow-up in its own tab and a complicated tag in the header', async () => {
    const user = userEvent.setup();
    render(<SaksvisningPage sakId="1001" />);

    await screen.findByRole('heading', { level: 1, name: 'FP-001 · Ingrid Hansen' });
    // CaseHeader gets the complicated tag from the loaded intern merknad (seed: sak 1001 is complicated).
    expect((await screen.findAllByText('Komplisert sak')).length).toBeGreaterThan(0);

    await user.click(await screen.findByRole('tab', { name: /Intern oppfølging/ }));

    const heading = await screen.findByRole('heading', { level: 2, name: 'Intern oppfølging' });
    const panel = heading.closest('section');
    if (!panel) {
      throw new Error('Fant ikke intern oppfølging-panelet');
    }
    expect(within(panel).getByText(/kun til internt bruk i Nav/)).toBeInTheDocument();
    expect(within(panel).getByText('Lagret intern merknad')).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'Rediger merknad' })).toBeInTheDocument();
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
