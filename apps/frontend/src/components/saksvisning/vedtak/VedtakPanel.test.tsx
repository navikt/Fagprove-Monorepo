import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  seedAvslagSakResponse,
  seedEngangsstonadSakResponse,
  seedInnvilgetSakResponse,
  seedManuellVurderingSakResponse,
} from '../../../mocks/foreldrepenger-seed';
import { VedtakPanel } from './VedtakPanel';

function getVedtakPanel() {
  const heading = screen.getByRole('heading', { name: 'Vedtak og beregning' });
  const panel = heading.closest('section');
  if (!panel) throw new Error('Fant ikke vedtak-panelet');
  return panel;
}

describe('VedtakPanel', () => {
  it('renders innvilget vedtak with beregning and stønadsperiode', () => {
    render(<VedtakPanel sak={seedInnvilgetSakResponse} />);

    const panel = getVedtakPanel();
    expect(
      within(panel).getByRole('row', { name: /Vedtaksvariant INNVILGET/ }),
    ).toBeInTheDocument();
    expect(
      within(panel).getByRole('row', { name: /Beregningsgrunnlag 648\s*000 kr/ }),
    ).toBeInTheDocument();
    expect(within(panel).getByRole('row', { name: /Stønadsperiode 49 uker/ })).toBeInTheDocument();
  });

  it('renders avslag with begrunnelse', () => {
    render(<VedtakPanel sak={seedAvslagSakResponse} />);

    const panel = getVedtakPanel();
    expect(within(panel).getByRole('row', { name: /Vedtaksvariant AVSLAG/ })).toBeInTheDocument();
    expect(
      within(panel).getByText('Opptjeningskravet er ikke oppfylt og søker er ikke norsk borger'),
    ).toBeInTheDocument();
  });

  it('renders engangsstønad with beløp', () => {
    render(<VedtakPanel sak={seedEngangsstonadSakResponse} />);

    const panel = getVedtakPanel();
    expect(
      within(panel).getByRole('row', { name: /Vedtaksvariant ENGANGSSTONAD/ }),
    ).toBeInTheDocument();
    expect(
      within(panel).getByRole('row', { name: /Beregningsgrunnlag 92\s*648 kr/ }),
    ).toBeInTheDocument();
  });

  it('shows pending state for manuell vurdering', () => {
    render(<VedtakPanel sak={seedManuellVurderingSakResponse} />);

    const panel = getVedtakPanel();
    expect(
      within(panel).getByRole('row', { name: /Vedtaksvariant MANUELL_VURDERING/ }),
    ).toBeInTheDocument();
    expect(
      within(panel).getByText('Saken må behandles manuelt før endelig vedtak kan fattes.'),
    ).toBeInTheDocument();
    expect(within(panel).getByRole('row', { name: /Beregningsgrunnlag —/ })).toBeInTheDocument();
  });
});
