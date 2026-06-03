import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

test('home page renders heading', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Velkommen' })).toBeVisible();
});

test('fetches greeting through the BFF route', async ({ page }) => {
  await page.route('**/api/hello', async (route) => {
    await route.fulfill({ json: { message: 'Hello from mocked BFF!' } });
  });

  await page.getByRole('button', { name: 'Hent hilsen' }).click();

  await expect(page.getByTestId('hello-message')).toHaveText('Hello from mocked BFF!');
});

test('shows loading state while fetching', async ({ page }) => {
  // Add a delay to the MSW handler so we can observe loading state
  await page.route('**/api/hello', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.fulfill({ json: { message: 'Delayed response' } });
  });

  const button = page.getByRole('button', { name: 'Hent hilsen' });
  await button.click();

  await expect(page.locator('[aria-busy="true"]')).toBeVisible();

  // Wait for success
  await expect(page.getByTestId('hello-message')).toHaveText('Delayed response');
  await expect(button).toBeEnabled();
});

test('shows error alert when API fails', async ({ page }) => {
  await page.route('**/api/hello', (route) =>
    route.fulfill({ status: 500, body: 'Internal Server Error' }),
  );

  await page.getByRole('button', { name: 'Hent hilsen' }).click();

  const alert = page.getByRole('alert');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText('Kunne ikke hente hilsen');
});

test('has no accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

  expect(results.violations).toEqual([]);
});
