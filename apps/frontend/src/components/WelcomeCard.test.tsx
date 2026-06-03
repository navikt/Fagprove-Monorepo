import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WelcomeCard } from './WelcomeCard';

describe('WelcomeCard', () => {
  it('renders heading and body text', () => {
    render(<WelcomeCard heading="Velkommen" body="Dette er en test." />);

    expect(screen.getByRole('heading', { name: 'Velkommen' })).toBeInTheDocument();
    expect(screen.getByText('Dette er en test.')).toBeInTheDocument();
  });
});
