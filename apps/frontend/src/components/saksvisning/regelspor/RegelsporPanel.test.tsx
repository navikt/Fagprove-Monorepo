import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import {
  seedInnvilgetSakResponse,
  seedManuellVurderingSakResponse,
} from '../../../mocks/foreldrepenger-seed';
import { RegelsporPanel } from './RegelsporPanel';

describe('RegelsporPanel', () => {
  it('renders the case label and scenario', () => {
    render(<RegelsporPanel sak={seedInnvilgetSakResponse} />);

    expect(screen.getByRole('heading', { name: 'Regler for FP-001' })).toBeInTheDocument();
    expect(screen.getByText(/Standard innvilgelse/)).toBeInTheDocument();
  });

  it('renders each rule step', () => {
    render(<RegelsporPanel sak={seedInnvilgetSakResponse} />);

    expect(screen.getByRole('heading', { name: 'Opptjening' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Beregningsgrunnlag' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Stønadsperiode' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Kvote' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Regelspor' })).toHaveTextContent('648000 kr');
  });

  it('shows manuell vurdering tag for a pending case', () => {
    render(<RegelsporPanel sak={seedManuellVurderingSakResponse} />);

    expect(screen.getByText('Manuell vurdering')).toBeInTheDocument();
  });

  it('opens income history accordion', async () => {
    const user = userEvent.setup();
    render(<RegelsporPanel sak={seedInnvilgetSakResponse} />);

    await user.click(screen.getByRole('button', { name: /Inntektshistorikk/ }));

    expect(screen.getByRole('table', { name: 'Inntektshistorikk' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Måned' })).toBeInTheDocument();
  });
});
