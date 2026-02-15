import { expect, test } from '@playwright/test';

const STARS_LIGHT_PATHS = [
  '/#/pages/starlight/index',
  '/pages/starlight/index',
  '/',
];

test('clicking planet opens world page with fullscreen canvas', async ({ page, baseURL }) => {
  const host = baseURL || 'http://127.0.0.1:10086';
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  const tryEnterStarlight = async (): Promise<boolean> => {
    const planet = page.locator('.planet-container').first();
    const skipIntroButton = page.locator('.skip-btn').first();

    await Promise.race([
      planet.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => undefined),
      skipIntroButton.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => undefined),
    ]);

    if (await planet.isVisible().catch(() => false)) {
      return true;
    }

    if (await skipIntroButton.isVisible().catch(() => false)) {
      await skipIntroButton.click();
      await expect(planet).toBeVisible({ timeout: 20_000 });
      return true;
    }

    return false;
  };

  let starlightLoaded = false;
  for (const path of STARS_LIGHT_PATHS) {
    await page.goto(`${host}${path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    if (await tryEnterStarlight()) {
      starlightLoaded = true;
      break;
    }
  }

  expect(starlightLoaded).toBeTruthy();

  const planet = page.locator('.planet-container').first();
  await expect(planet).toBeAttached();
  await planet.dispatchEvent('click');

  await page.waitForURL((url) => url.href.includes('/pages/world/index'));
  const canvas = page.locator('.world-viewport canvas').first();
  await expect(canvas).toBeVisible();

  const viewport = page.viewportSize();
  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).not.toBeNull();
  expect(viewport).not.toBeNull();

  if (canvasBox && viewport) {
    expect(canvasBox.width).toBeGreaterThan(viewport.width * 0.85);
    expect(canvasBox.height).toBeGreaterThan(viewport.height * 0.85);
  }

  await page.waitForTimeout(1200);
  expect(pageErrors).toEqual([]);
});
