import { test, expect } from '@playwright/test';

test('Navigate to World page and capture screenshots', async ({ page }) => {
  // Collect console messages
  const consoleMessages: string[] = [];
  const errors: string[] = [];

  page.on('console', (msg) => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleMessages.push(text);
    console.log(text);
  });

  page.on('pageerror', (error) => {
    const text = `[PAGE ERROR] ${error.message}`;
    errors.push(text);
    console.error(text);
  });

  // First, navigate to home to set up proper state
  console.log('Navigating to home page first...');
  await page.goto('/');
  
  // Wait for the page to load
  await page.waitForTimeout(1000);

  // Click skip button if present
  const skipButton = page.locator('text=跳过');
  if (await skipButton.isVisible().catch(() => false)) {
    console.log('Clicking skip button...');
    await skipButton.click();
    await page.waitForTimeout(500);
  }

  // Now navigate directly to the world page via hash
  console.log('Navigating to /pages/world/index...');
  await page.evaluate(() => {
    window.location.hash = '#/pages/world/index';
  });
  
  // Wait for navigation
  await page.waitForTimeout(1000);

  // Take first screenshot immediately after navigation
  console.log('Taking first screenshot...');
  await page.screenshot({ 
    path: 'world-initial.png',
    fullPage: true 
  });

  // Get page title
  const title = await page.title();
  console.log(`Page title: ${title}`);

  // Wait 5 seconds for 3D scene initialization
  console.log('Waiting 5 seconds for 3D scene initialization...');
  await page.waitForTimeout(5000);

  // Take second screenshot after waiting
  console.log('Taking second screenshot after 5s...');
  await page.screenshot({ 
    path: 'world-after-5s.png',
    fullPage: true 
  });

  // Get all visible text
  const bodyText = await page.locator('body').textContent();
  console.log('Visible text on page:', bodyText);

  // Check for error messages
  const errorElements = await page.locator('[class*="error"]').all();
  console.log(`Found ${errorElements.length} elements with "error" in className`);

  // Check for loading indicators
  const loadingElements = await page.locator('[class*="loading"]').all();
  console.log(`Found ${loadingElements.length} elements with "loading" in className`);

  // Check for canvas element (3D scene)
  const canvas = page.locator('canvas');
  const canvasCount = await canvas.count();
  console.log(`Found ${canvasCount} canvas element(s)`);

  if (canvasCount > 0) {
    const canvasVisible = await canvas.first().isVisible();
    console.log(`Canvas is visible: ${canvasVisible}`);
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Page Title: ${title}`);
  console.log(`Canvas elements: ${canvasCount}`);
  console.log(`Error elements: ${errorElements.length}`);
  console.log(`Loading elements: ${loadingElements.length}`);
  console.log(`Console messages: ${consoleMessages.length}`);
  console.log(`Page errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n=== ERRORS ===');
    errors.forEach(err => console.log(err));
  }

  console.log('\n=== CONSOLE MESSAGES (last 20) ===');
  consoleMessages.slice(-20).forEach(msg => console.log(msg));
});
