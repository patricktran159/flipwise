import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';

const fixture = (name: string) => path.join(import.meta.dirname, '..', 'fixtures', name);

async function importCsv(page: Page, file: string) {
  await page.goto('./#/import');
  await page.locator('input[type=file]').setInputFiles(fixture(file));
}

async function importAndConfirm(page: Page, file: string) {
  await importCsv(page, file);
  await page.getByRole('button', { name: /^(Import|Replace with) \d+ cards?$/ }).click();
  await expect(page.getByText('Import complete')).toBeVisible();
  await page.getByRole('button', { name: 'Go to Home' }).click();
}

async function reveal(page: Page) {
  await page.getByRole('button', { name: 'Show Answer' }).click();
}

const question = (page: Page) => page.locator('.flashcard .q');

test('first run shows the welcome screen', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Import CSV' })).toBeVisible();
});

test('imports a CSV and shows overall progress and chapters', async ({ page }) => {
  await importCsv(page, 'sample-v1.csv');
  await expect(page.getByText('Ready to import')).toBeVisible();
  const kv = page.locator('dl.kv').first();
  await expect(kv).toContainText('Cards5');
  await expect(kv).toContainText('Chapters2');
  await expect(kv).toContainText('Sections3');
  await expect(kv).toContainText('Empty rows skipped1');
  await page.getByRole('button', { name: 'Import 5 cards' }).click();
  await page.getByRole('button', { name: 'Go to Home' }).click();

  await expect(page.getByText('0%')).toBeVisible();
  await expect(page.getByText('mastered · 0 of 5')).toBeVisible();

  await page.getByRole('button', { name: /Chapters/ }).click();
  await expect(page.locator('.chapter-row')).toHaveCount(2);
  await expect(page.locator('.chapter-row').first()).toContainText('Chapter 1: Data Management');
  await expect(page.locator('.chapter-row').first()).toContainText('3 cards · 0 mastered');

  await page.locator('.chapter-row').first().click();
  await expect(page.getByRole('button', { name: /All Sections/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /Key Definitions & Terminology/ }).click();
  await expect(page.getByRole('button', { name: 'Study 1 card' })).toBeVisible();
});

test('rejects an invalid CSV with row-level errors', async ({ page }) => {
  await importCsv(page, 'invalid.csv');
  await expect(page.getByText("Can't import this file")).toBeVisible();
  const issues = page.locator('.issues li');
  await expect(issues).toHaveCount(3);
  await expect(issues.nth(0)).toContainText('Row 3');
  await expect(issues.nth(0)).toContainText('Duplicate');
  await expect(issues.nth(1)).toContainText('Question is empty');
  await expect(issues.nth(2)).toContainText('Expected 5 columns');
});

test('study flow: reveal, Again requeues, Good completes, undo, summary', async ({ page }) => {
  await importAndConfirm(page, 'sample-v1.csv');
  await page.getByRole('button', { name: /Chapters/ }).click();
  await page.locator('.chapter-row').first().click();
  await page.getByRole('button', { name: 'Study 3 cards' }).click();

  await expect(page.getByText('Card 1 of 3')).toBeVisible();
  await expect(page.locator('.where')).toContainText('Chapter 1: Data Management');
  await expect(page.locator('.where')).toContainText('CDMP Exam Focus');
  const first = await question(page).textContent();
  expect(first).toContain('define Data Management');

  // Answer stays hidden until revealed.
  await expect(page.getByText('The development, execution')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Again/ })).toHaveCount(0);
  await reveal(page);
  await expect(page.getByText('The development, execution')).toBeVisible();

  // Again: with only 2 other cards left it returns at the end of the queue.
  await page.getByRole('button', { name: /Again/ }).click();
  await expect(question(page)).toContainText('DIKW');
  await expect(page.getByText('Card 1 of 3')).toBeVisible();

  // Undo brings back the first card with its answer shown.
  await page.getByRole('button', { name: 'Undo last rating' }).click();
  await expect(question(page)).toContainText('define Data Management');
  await expect(page.getByText('The development, execution')).toBeVisible();
  await page.getByRole('button', { name: /Good/ }).click();

  await expect(page.getByText('Card 2 of 3')).toBeVisible();
  await reveal(page);
  await page.getByRole('button', { name: /Good/ }).click();
  await reveal(page);
  await page.getByRole('button', { name: /Good/ }).click();

  await expect(page.getByRole('heading', { name: 'Session complete' })).toBeVisible();
  await expect(page.locator('.tile').filter({ hasText: 'Good' })).toContainText('3');
  await page.getByRole('button', { name: 'Done' }).click();

  // Home reflects the reviews: 3 learning, 2 new, 3 reviewed today.
  await expect(page.locator('.legend')).toContainText('Learning3');
  await expect(page.locator('.legend')).toContainText('New2');
  await expect(page.getByText('Reviewed today:')).toContainText('3 cards');
});

test('Hard and Again feed the Difficult and Missed reviews', async ({ page }) => {
  await importAndConfirm(page, 'sample-v1.csv');
  await page.getByRole('button', { name: /Start Review/ }).click();
  await reveal(page);
  await page.getByRole('button', { name: /Hard/ }).click();
  await reveal(page);
  await page.getByRole('button', { name: /Again/ }).click();
  await page.getByRole('button', { name: 'Close session' }).click();

  await expect(page.getByRole('button', { name: /Resume session/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Review Difficult/ })).toContainText('1');
  await expect(page.getByRole('button', { name: /Review Missed/ })).toContainText('1');

  page.on('dialog', (d) => d.accept());
  await page.getByRole('button', { name: /Review Missed/ }).click();
  await expect(page.getByText('Card 1 of 1')).toBeVisible();
  await expect(question(page)).toContainText('DIKW');
});

test('session survives a reload and can be resumed', async ({ page }) => {
  await importAndConfirm(page, 'sample-v1.csv');
  await page.getByRole('button', { name: /Start Review/ }).click();
  await reveal(page);
  await page.getByRole('button', { name: /Good/ }).click();
  await expect(page.getByText('Card 2 of 5')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Card 2 of 5')).toBeVisible();
});

test('replacing the CSV keeps progress for matching cards', async ({ page }) => {
  await importAndConfirm(page, 'sample-v1.csv');
  await page.getByRole('button', { name: /Start Review/ }).click();
  // Rate Ch1#1 Good, Ch1#2 Hard, Ch1#3 (removed in v2) Good.
  for (const r of ['Good', 'Hard', 'Good']) {
    await reveal(page);
    await page.getByRole('button', { name: new RegExp(r) }).click();
  }
  await page.getByRole('button', { name: 'Close session' }).click();

  await importCsv(page, 'sample-v2.csv');
  await expect(page.getByText('Ready to replace')).toBeVisible();
  const changes = page.locator('section', { hasText: 'Changes' }).locator('dl.kv');
  await expect(changes).toContainText('Unchanged3');
  await expect(changes).toContainText('Text updated (progress kept)1');
  await expect(changes).toContainText('New cards1');
  await expect(changes).toContainText('Removed cards1');
  await expect(changes).toContainText('Cards keeping progress2');
  await expect(page.getByText('Your current study session will end.')).toBeVisible();
  await page.getByRole('button', { name: 'Replace with 5 cards' }).click();
  await page.getByRole('button', { name: 'Go to Home' }).click();

  await expect(page.locator('.legend')).toContainText('Learning1');
  await expect(page.locator('.legend')).toContainText('Difficult1');
  await expect(page.locator('.legend')).toContainText('New3');
  await expect(page.getByRole('button', { name: /Resume session/ })).toHaveCount(0);

  await page.goto('./#/settings');
  await expect(page.getByRole('button', { name: 'Clear hidden progress (1)' })).toBeVisible();
});

test('settings change text size and theme', async ({ page }) => {
  await page.goto('./#/settings');
  await page.getByRole('button', { name: 'XL' }).click();
  await page.getByRole('button', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-text', 'xl');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('the study screen fits an iPhone without horizontal scrolling', async ({ page }) => {
  await importAndConfirm(page, 'sample-v1.csv');
  await page.getByRole('button', { name: /Start Review/ }).click();
  await reveal(page);
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  const box = await page.getByRole('button', { name: /Good/ }).boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(56);
  expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
});

test('works offline after the first load', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Playwright supports service workers in Chromium only');
  await page.goto('./');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await importAndConfirm(page, 'sample-v1.csv');

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('mastered · 0 of 5')).toBeVisible();
  await page.getByRole('button', { name: /Chapters/ }).click();
  await page.locator('.chapter-row').nth(1).click();
  await page.getByRole('button', { name: /Overview/ }).click();
  await page.getByRole('button', { name: 'Study 1 card' }).click();
  await reveal(page);
  await expect(page.getByText('line two, with a comma.')).toBeVisible();
  await page.getByRole('button', { name: /Good/ }).click();
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByText('Reviewed today:')).toContainText('1 card');
  await page.goto('./#/progress');
  await expect(page.locator('.tile').filter({ hasText: 'Reviewed today' })).toContainText('1');
});
