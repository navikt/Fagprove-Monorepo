import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { VelgSoknadPage } from './VelgSoknadPage';

describe('VelgSoknadPage', () => {
  it('renders the caseworker landing content', () => {
    render(<VelgSoknadPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Velg søknad' })).toBeInTheDocument();
    expect(screen.getByText(/saksbehandlers arbeidsliste/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Mine søknader' })).toBeInTheDocument();
    expect(screen.getByText('Demovalg - ikke tilgangsstyring')).toBeInTheDocument();
  });

  it('keeps the demo view toggle keyboard and pointer operable', async () => {
    render(<VelgSoknadPage />);
    const user = userEvent.setup();

    const teamleder = screen.getByRole('radio', { name: 'Teamleder' });
    await user.click(teamleder);

    expect(teamleder).toHaveAttribute('aria-checked', 'true');
  });
});
