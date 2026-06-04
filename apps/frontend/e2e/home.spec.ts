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
  await expect(page.getByText(/Standard innvilgelse/)).toBeVisible();
});

test('opens an application and shows case details', async ({ page }) => {
  await page.getByRole('button', { name: 'Åpne sak' }).first().click();

  await expect(page).toHaveURL(/\/saker\/1001$/);
  await expect(
    page.getByRole('heading', { level: 1, name: /FP-001 · Ingrid Hansen/ }),
  ).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Regelspor' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Saksdata' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Opptjening' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Inntektshistorikk/ })).toBeVisible();

  await page.getByRole('tab', { name: 'Vedtak' }).click();

  await expect(page.getByRole('heading', { name: 'Vedtak og beregning' })).toBeVisible();
  await expect(page.getByRole('row', { name: /Beregningsgrunnlag 648\s*000 kr/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Kvotevisualisering' })).toBeVisible();
  await expect(page.getByText('Forhånd: 3 uker')).toBeVisible();
  await expect(page.getByText('Mor: 15 uker')).toBeVisible();
});

test('submits a manual decision and shows final vedtak', async ({ page }) => {
  await page
    .getByRole('row', { name: /FP-004.*Manuell vurdering: stort avvik/ })
    .getByRole('button', { name: 'Åpne sak' })
    .click();

  await expect(page).toHaveURL(/\/saker\/1004$/);
  await page.getByRole('tab', { name: 'Vedtak' }).click();

  await expect(page.getByText(/For stort sprik mellom tre måneders snitt/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Kvotevisualisering' })).toBeVisible();
  await page
    .getByLabel('Saksbehandlers begrunnelse')
    .fill('Inntektsgrunnlaget er kontrollert manuelt.');
  await page.getByRole('button', { name: 'Innvilg manuelt' }).click();

  await expect(page.getByRole('row', { name: /Vedtaksvariant INNVILGET/ })).toBeVisible();
  await expect(page.getByText('Inntektsgrunnlaget er kontrollert manuelt.')).toBeVisible();
  await expect(page.getByRole('row', { name: /Besluttet av Kari Saksbehandler/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Innvilg manuelt' })).toHaveCount(0);
});

test('has no accessibility violations', async ({ page }) => {
  await expect(page.getByRole('columnheader', { name: 'Sak' })).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

  expect(results.violations).toEqual([]);
});
