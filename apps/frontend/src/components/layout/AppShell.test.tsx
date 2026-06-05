import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('exposes the header home link as primary navigation', () => {
    render(
      <AppShell>
        <h1>Innhold</h1>
      </AppShell>,
    );

    const navigation = screen.getByRole('navigation', { name: 'Hovednavigasjon' });

    expect(within(navigation).getByRole('link', { name: 'Foreldrepenger' })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
