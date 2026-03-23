import { test } from '@playwright/test';
import fs from 'fs';

test.beforeAll(() => {
  try { fs.mkdirSync('screenshots', { recursive: true }); } catch {}
});

test('capture home', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `screenshots/home.png`, fullPage: true });
});

test('capture game (with query names)', async ({ page }) => {
  // provide player names via query params so page doesn't redirect to home
  await page.goto('http://localhost:3000/game?p1=Alice&p2=Bob');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `screenshots/game.png`, fullPage: true });
});

test('capture leaderboard (mocked)', async ({ page }) => {
  // mock leaderboard API so we always have entries when running against a static build
  await page.route('**/leaderboard', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { rank: 1, user_name: 'Alice', duration_ms: 1234 },
        { rank: 2, user_name: 'Bob', duration_ms: 2345 },
      ])
    })
  })

  await page.goto('http://localhost:3000/leaderboard');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `screenshots/leaderboard.png`, fullPage: true });
});

