const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMessages = [];
  const errors = [];

  // Capture console messages
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  // Capture page errors
  page.on('pageerror', error => {
    errors.push(error.toString());
  });

  try {
    console.log('Navigating to http://localhost:10086/pages/world/index');
    await page.goto('http://localhost:10086/pages/world/index', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });

    console.log('Waiting 8 seconds for Babylon.js scene to load...');
    await page.waitForTimeout(8000);

    // Check for canvas element
    const canvasExists = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        return {
          exists: true,
          width: canvas.width,
          height: canvas.height,
          style: {
            width: canvas.style.width,
            height: canvas.style.height
          }
        };
      }
      return { exists: false };
    });

    // Take screenshot
    await page.screenshot({ path: 'world-page-screenshot.png', fullPage: true });
    console.log('Screenshot saved to world-page-screenshot.png');

    // Report findings
    console.log('\n=== CANVAS STATUS ===');
    console.log(JSON.stringify(canvasExists, null, 2));

    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => {
      console.log(`[${msg.type}] ${msg.text}`);
    });

    console.log('\n=== PAGE ERRORS ===');
    if (errors.length > 0) {
      errors.forEach(err => console.log(err));
    } else {
      console.log('No JavaScript errors detected');
    }

  } catch (error) {
    console.error('Error during page check:', error);
  } finally {
    await browser.close();
  }
})();
