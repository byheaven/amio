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
    // Step 1: Go to http://localhost:10086
    console.log('Step 1: Navigating to http://localhost:10086');
    await page.goto('http://localhost:10086', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });

    // Step 2: Set localStorage to bypass intro screen
    console.log('Step 2: Setting localStorage to bypass intro screen');
    await page.evaluate(() => {
      localStorage.setItem('amio_game_progress', JSON.stringify({
        hasSeenIntro: true,
        date: '2026-02-22',
        dailyChestClaimed: false,
        heroChestClaimed: false
      }));
    });

    // Step 3: Navigate to starlight page (tab page) first
    console.log('Step 3: Navigating to starlight page (bypassing intro)');
    await page.goto('http://localhost:10086/pages/starlight/index', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    await page.waitForTimeout(2000);

    // Step 4: Now navigate to world page using hash navigation (SPA style)
    console.log('Step 4: Navigating to world page');
    await page.goto('http://localhost:10086#/pages/world/index', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });

    // Step 5: Wait 10 seconds for Babylon.js scene to load
    console.log('Step 5: Waiting 10 seconds for Babylon.js 3D scene to load...');
    await page.waitForTimeout(10000);

    // Step 6: Take screenshot
    console.log('Step 6: Taking screenshot');
    await page.screenshot({ path: 'world-page-test.png', fullPage: true });
    console.log('Screenshot saved to world-page-test.png');

    // Step 7: Check conditions
    console.log('Step 7: Checking conditions');
    
    // Check for canvas element
    const canvasCheck = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        return {
          exists: true,
          width: canvas.width,
          height: canvas.height,
          style: {
            width: canvas.style.width,
            height: canvas.style.height,
            display: canvas.style.display,
            position: canvas.style.position
          },
          className: canvas.className,
          id: canvas.id
        };
      }
      return { exists: false };
    });

    // Check for Babylon.js indicators
    const babylonCheck = await page.evaluate(() => {
      const hasBabylonGlobal = typeof window.BABYLON !== 'undefined';
      const hasEngine = window.__babylonEngine !== undefined;
      const hasScene = window.__babylonScene !== undefined;
      return {
        hasBabylonGlobal,
        hasEngine,
        hasScene
      };
    });

    // Check for any visible 3D world indicators
    const worldIndicators = await page.evaluate(() => {
      const body = document.body;
      const hasCanvas = document.querySelector('canvas') !== null;
      const bodyText = body.innerText;
      const pageTitle = document.title;
      return {
        hasCanvas,
        pageTitle,
        bodyText: bodyText.substring(0, 500), // First 500 chars
        bodyHTML: body.innerHTML.substring(0, 1000) // First 1000 chars of HTML
      };
    });

    // Report findings
    console.log('\n==========================================');
    console.log('=== TEST RESULTS ===');
    console.log('==========================================\n');

    console.log('1. CANVAS ELEMENT:');
    if (canvasCheck.exists) {
      console.log('   ✅ Canvas element found');
      console.log(`   - Dimensions: ${canvasCheck.width}x${canvasCheck.height}`);
      console.log(`   - Style width/height: ${canvasCheck.style.width}/${canvasCheck.style.height}`);
      console.log(`   - ID: ${canvasCheck.id || 'none'}`);
      console.log(`   - Class: ${canvasCheck.className || 'none'}`);
    } else {
      console.log('   ❌ No canvas element found');
    }

    console.log('\n2. BABYLON.JS STATUS:');
    console.log(`   - BABYLON global: ${babylonCheck.hasBabylonGlobal ? '✅ Found' : '❌ Not found'}`);
    console.log(`   - Engine instance: ${babylonCheck.hasEngine ? '✅ Found' : '❌ Not found'}`);
    console.log(`   - Scene instance: ${babylonCheck.hasScene ? '✅ Found' : '❌ Not found'}`);

    console.log('\n3. JAVASCRIPT ERRORS:');
    if (errors.length > 0) {
      console.log(`   ❌ ${errors.length} error(s) detected:`);
      errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
    } else {
      console.log('   ✅ No JavaScript errors detected');
    }

    console.log('\n4. PAGE INDICATORS:');
    console.log(`   - Page title: ${worldIndicators.pageTitle}`);
    console.log(`   - Canvas present: ${worldIndicators.hasCanvas ? '✅ Yes' : '❌ No'}`);
    console.log(`   - Page text preview: ${worldIndicators.bodyText.substring(0, 200).replace(/\n/g, ' ')}...`);

    console.log('\n5. CONSOLE MESSAGES (last 15):');
    if (consoleMessages.length > 0) {
      const errorMessages = consoleMessages.filter(m => m.type === 'error');
      const warningMessages = consoleMessages.filter(m => m.type === 'warning');
      const recentMessages = consoleMessages.slice(-15);
      
      if (errorMessages.length > 0) {
        console.log(`   Errors (${errorMessages.length}):`);
        errorMessages.forEach(msg => console.log(`     ❌ ${msg.text}`));
      }
      if (warningMessages.length > 0) {
        console.log(`   Warnings (${warningMessages.length}):`);
        warningMessages.forEach(msg => console.log(`     ⚠️  ${msg.text}`));
      }
      console.log(`   Recent messages (last 15 of ${consoleMessages.length}):`);
      recentMessages.forEach(msg => {
        const icon = msg.type === 'error' ? '❌' : msg.type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`     ${icon} [${msg.type}] ${msg.text}`);
      });
    } else {
      console.log('   No console messages captured');
    }

    console.log('\n==========================================');
    console.log('=== SUMMARY ===');
    console.log('==========================================');
    console.log(`✓ Canvas element: ${canvasCheck.exists ? '✅ PRESENT' : '❌ MISSING'}`);
    console.log(`✓ Babylon.js loaded: ${babylonCheck.hasBabylonGlobal ? '✅ YES' : '❌ NO'}`);
    console.log(`✓ JavaScript errors: ${errors.length === 0 ? '✅ NONE' : '❌ ' + errors.length + ' ERROR(S)'}`);
    console.log(`✓ 3D world status: ${canvasCheck.exists && errors.length === 0 ? '✅ LIKELY WORKING' : '❌ ISSUES DETECTED'}`);
    console.log('==========================================\n');

  } catch (error) {
    console.error('\n❌ ERROR during page check:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
})();
