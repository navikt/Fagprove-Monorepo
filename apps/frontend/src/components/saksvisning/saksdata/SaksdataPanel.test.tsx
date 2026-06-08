import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  seedInnvilgetSakResponse,
  seedManuellVurderingSakResponse,
} from '../../../mocks/foreldrepenger-seed';
import { SaksdataPanel } from './SaksdataPanel';

describe('SaksdataPanel', () => {
  it('renders core case fields', () => {
    render(<SaksdataPanel sak={seedInnvilgetSakResponse} />);

    expect(screen.getByText('Søkerident')).toBeInTheDocument();
    expect(screen.getByText('TEST-0001')).toBeInTheDocument();
    expect(screen.getByText('Termindato')).toBeInTheDocument();
    expect(screen.getByText('01.08.2026')).toBeInTheDocument();
    expect(screen.getByText('Oppgitt årsinntekt')).toBeInTheDocument();
    expect(screen.getByText(/648\s*000 kr/)).toBeInTheDocument();
    expect(screen.getByText('Bekreftet')).toBeInTheDocument();
    expect(screen.getByText('100 %')).toBeInTheDocument();
  });

  it('shows manual reason alert for a pending case', () => {
    render(<SaksdataPanel sak={seedManuellVurderingSakResponse} />);

    expect(screen.getByText(/For stort sprik/)).toBeInTheDocument();
  });

  it('does not show manual reason alert for a finalized case', () => {
    render(<SaksdataPanel sak={seedInnvilgetSakResponse} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
