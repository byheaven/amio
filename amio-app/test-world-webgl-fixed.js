const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('Launching Chromium with WebGL enabled...');
  
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist'
    ]
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Collect console messages and errors
  const consoleMessages = [];
  const jsErrors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    console.log(`Console [${msg.type()}]:`, text);
  });
  
  page.on('pageerror', error => {
    jsErrors.push(error.message);
    console.error('JS Error:', error.message);
  });
  
  try {
    // Step 1: Go to home page
    console.log('\nStep 1: Navigating to http://localhost:10086');
    await page.goto('http://localhost:10086', { waitUntil: 'networkidle' });
    console.log('Home page loaded');
    
    // Step 2: Set localStorage
    console.log('\nStep 2: Setting localStorage...');
    await page.evaluate(() => {
      localStorage.setItem('amio_game_progress', JSON.stringify({
        hasSeenIntro: true,
        date: '2026-02-22',
        dailyChestClaimed: false,
        heroChestClaimed: false
      }));
    });
    console.log('localStorage set successfully');
    
    // Step 3: Navigate to world page
    console.log('\nStep 3: Navigating to world page...');
    await page.goto('http://localhost:10086/pages/world/index', { waitUntil: 'networkidle' });
    console.log('World page loaded');
    
    // Step 4: Wait 15 seconds for loading
    console.log('\nStep 4: Waiting 15 seconds for scene initialization...');
    await page.waitForTimeout(15000);
    
    // Step 5: Take screenshot
    console.log('\nStep 5: Taking screenshot...');
    await page.screenshot({ path: 'world-webgl-fixed-test.png', fullPage: true });
    console.log('Screenshot saved as world-webgl-fixed-test.png');
    
    // Step 6: Check page state
    console.log('\nStep 6: Checking page state...');
    
    const pageState = await page.evaluate(() => {
      // Check for loading overlay
      const loadingOverlay = document.querySelector('.world-loading-overlay') || 
                            document.querySelector('[class*="loading"]') ||
                            document.querySelector('.loading-overlay');
      const loadingVisible = loadingOverlay ? 
        window.getComputedStyle(loadingOverlay).display !== 'none' : false;
      
      // Check for canvas
      const canvas = document.querySelector('canvas');
      const hasCanvas = !!canvas;
      const canvasInfo = canvas ? {
        width: canvas.width,
        height: canvas.height,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight
      } : null;
      
      // Get body content for visibility check
      const bodyHTML = document.body.innerHTML.substring(0, 500);
      
      return {
        loadingOverlayExists: !!loadingOverlay,
        loadingVisible,
        hasCanvas,
        canvasInfo,
        bodyPreview: bodyHTML,
        title: document.title
      };
    });
    
    console.log('\n=== TEST RESULTS ===');
    console.log('\nPage State:');
    console.log('  - Title:', pageState.title);
    console.log('  - Loading overlay exists:', pageState.loadingOverlayExists);
    console.log('  - Loading overlay visible:', pageState.loadingVisible);
    console.log('  - Has canvas:', pageState.hasCanvas);
    if (pageState.canvasInfo) {
      console.log('  - Canvas dimensions:', pageState.canvasInfo);
    }
    
    console.log('\nJavaScript Errors:', jsErrors.length === 0 ? 'None' : jsErrors);
    
    console.log('\nConsole Messages (last 20):');
    consoleMessages.slice(-20).forEach(msg => console.log('  ', msg));
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log('✓ Loading overlay gone:', !pageState.loadingVisible);
    console.log('✓ Canvas present:', pageState.hasCanvas);
    console.log('✓ No JS errors:', jsErrors.length === 0);
    
    // Keep browser open for manual inspection
    console.log('\nBrowser will stay open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    await page.screenshot({ path: 'world-webgl-fixed-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\nTest complete. Browser closed.');
  }
})();
