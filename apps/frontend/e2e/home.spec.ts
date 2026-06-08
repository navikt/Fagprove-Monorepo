import { test, expect } from './fixtures';

test('renders heading, header and demo view toggle', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Velg søknad' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Hovednavigasjon' })).toBeVisible();
  await expect(page.getByText('Kari Saksbehandler', { exact: true })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Saksbehandler' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Teamleder' })).toBeVisible();
  await expect(page.getByText('Demovalg - ikke tilgangsstyring')).toBeVisible();
});

test('renders the application list', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Mine søknader' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Sak' })).toBeVisible();
  await expect(page.getByText('FP-001')).toBeVisible();
  await expect(page.getByText('TEST-0001')).toBeVisible();
  await expect(page.getByText(/Standard innvilgelse/)).toBeVisible();
});

test('has no accessibility violations', async ({ page }) => {
  const AxeBuilder = (await import('@axe-core/playwright')).default;
  await expect(page.getByRole('columnheader', { name: 'Sak' })).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});
