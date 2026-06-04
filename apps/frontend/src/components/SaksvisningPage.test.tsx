import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { SAKER_API_PATH } from '../lib/foreldrepenger';
import { server } from '../../test/setup';
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
    expect(screen.getByRole('heading', { name: 'Kvotefordeling' })).toBeInTheDocument();
    expect(screen.getByText(/Beregningsgrunnlag er 648000 kr/)).toBeInTheDocument();
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

  it.each<[string, string, RegExp, RegExp | undefined]>([
    ['1001', 'Innvilget'],
    ['1002', 'Avslag'],
    ['1003', 'Engangsstønad'],
    ['1004', 'Manuell vurdering'],
  ])('renders vedtaksvariant %s without crashing', async (sakId, label) => {
    render(<SaksvisningPage sakId={sakId} />);

    const vedtakPanel = await openVedtakTab();

    expect(within(vedtakPanel).getByText(label)).toBeInTheDocument();
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

    expect(within(vedtakPanel).getByText('Manuell vurdering')).toBeInTheDocument();
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
