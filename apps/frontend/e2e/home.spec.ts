import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

test('home page renders heading', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Velg søknad' })).toBeVisible();
});

test('renders internal header and demo view toggle', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Foreldrepenger' })).toBeVisible();
  await expect(page.getByText('Kari Saksbehandler', { exact: true })).toBeVisible();
  await expect(page.getByText('Avdeling foreldrepenger')).toBeVisible();

  await expect(page.getByRole('radio', { name: 'Saksbehandler' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Teamleder' })).toBeVisible();
  await expect(page.getByText('Demovalg - ikke tilgangsstyring')).toBeVisible();
});

test('renders the application list', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Mine søknader' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Sak' })).toBeVisible();
  await expect(page.getByText('FP-001')).toBeVisible();
  await expect(page.getByText('TEST-0001')).toBeVisible();
  await expect(page.getByText('Standard innvilgelse')).toBeVisible();
});

test('opens an application and navigates to the case placeholder', async ({ page }) => {
  await page.getByRole('button', { name: 'Åpne sak' }).first().click();

  await expect(page).toHaveURL(/\/saker\/1001$/);
  await expect(page.getByRole('heading', { name: 'Sak 1001' })).toBeVisible();
});

test('has no accessibility violations', async ({ page }) => {
  await expect(page.getByRole('columnheader', { name: 'Sak' })).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

  expect(results.violations).toEqual([]);
});
