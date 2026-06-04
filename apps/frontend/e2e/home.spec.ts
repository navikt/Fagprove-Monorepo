import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

test('home page renders heading', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Velg søknad' })).toBeVisible();
});

test('renders internal header and demo view toggle', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Foreldrepenger' })).toBeVisible();
  await expect(page.getByText('Kari Saksbehandler')).toBeVisible();
  await expect(page.getByText('Avdeling foreldrepenger')).toBeVisible();

  await expect(page.getByRole('radio', { name: 'Saksbehandler' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Teamleder' })).toBeVisible();
  await expect(page.getByText('Demovalg - ikke tilgangsstyring')).toBeVisible();
});

test('renders empty søknad section for the next frontend step', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Mine søknader' })).toBeVisible();
  await expect(page.getByText('Ingen søknader er lastet inn ennå')).toBeVisible();
  await expect(page.getByText('/api/v1/foreldrepenger/soknader')).toBeVisible();
});

test('has no accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

  expect(results.violations).toEqual([]);
});
