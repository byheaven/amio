const { chromium } = require('playwright');

(async () => {
  console.log('Launching Chromium with WebGL support...');
  
  const browser = await chromium.launch({
    headless: true,  // New headless mode has better WebGL support
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--enable-gpu-rasterization'
    ]
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Collect console messages
  const consoleMessages = [];
  const errors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });
  
  page.on('pageerror', error => {
    errors.push(`Page error: ${error.message}`);
  });
  
  try {
    // Step 2 & 3: Navigate to home page first
    console.log('Navigating to home page...');
    await page.goto('http://localhost:10086', { waitUntil: 'domcontentloaded' });
    
    console.log('Setting localStorage...');
    await page.evaluate(() => {
      localStorage.setItem('amio_game_progress', JSON.stringify({
        hasSeenIntro: true,
        date: '2026-02-22',
        dailyChestClaimed: false,
        heroChestClaimed: false,
        normalCompleted: true,
        normalStats: { attempts: 1, toolsUsed: 0, undoUsed: false, shuffleUsed: false, popUsed: false }
      }));
    });
    
    // Wait for intro page to load
    await page.waitForTimeout(2000);
    
    // Click skip button to bypass intro
    console.log('Clicking skip button...');
    const skipButton = await page.locator('text=跳过').first();
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Step 4: Navigate to world page via Taro router
    console.log('Navigating to world page via hash...');
    await page.evaluate(() => {
      window.location.hash = '#/pages/world/index';
    });
    await page.waitForTimeout(2000);
    
    // Step 5: Wait for loading to complete by checking if loading overlay disappears
    console.log('Waiting for world to load (checking for loading overlay to disappear)...');
    try {
      await page.waitForSelector('text=Loading SharkStar...', { state: 'hidden', timeout: 30000 });
      console.log('Loading completed - overlay disappeared');
    } catch (e) {
      console.log('Loading overlay still visible after 30s timeout');
    }
    
    // Wait additional 2 seconds for rendering
    await page.waitForTimeout(2000);
    
    // Step 6: Take screenshot
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'world-webgl-test.png', fullPage: false });
    
    // Step 8: Check if canvas element exists
    const canvasExists = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return {
        exists: !!canvas,
        width: canvas?.width,
        height: canvas?.height,
        id: canvas?.id,
        className: canvas?.className
      };
    });
    
    // Check loading state
    const loadingInfo = await page.evaluate(() => {
      const loadingElement = document.querySelector('.world-page__loading');
      const canvasElement = document.querySelector('.world-runtime-canvas');
      return {
        loadingElementExists: !!loadingElement,
        loadingElementVisible: loadingElement ? window.getComputedStyle(loadingElement).display !== 'none' : false,
        loadingTextContent: loadingElement?.textContent,
        canvasElementExists: !!canvasElement,
        canvasStyle: canvasElement ? {
          display: window.getComputedStyle(canvasElement).display,
          width: canvasElement.clientWidth,
          height: canvasElement.clientHeight
        } : null
      };
    });
    
    // Check if canvas is rendering (check pixel data)
    const renderingInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas.world-runtime-canvas');
      if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
        return { canvasFound: false };
      }
      
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        return { canvasFound: true, webglContext: false };
      }
      
      // Read a pixel to see if anything is being rendered
      const pixels = new Uint8Array(4);
      gl.readPixels(canvas.width / 2, canvas.height / 2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      
      return {
        canvasFound: true,
        webglContext: true,
        centerPixel: Array.from(pixels),
        isBlack: pixels[0] === 0 && pixels[1] === 0 && pixels[2] === 0
      };
    });
    
    // Get page content for analysis
    const pageInfo = await page.evaluate(() => {
      return {
        url: window.location.href,
        hash: window.location.hash,
        pathname: window.location.pathname,
        title: document.title,
        bodyText: document.body.innerText.substring(0, 300)
      };
    });
    
    const pageContent = await page.content();
    const hasThreeJs = pageContent.includes('three.js') || pageContent.includes('THREE');
    const hasBabylonJs = pageContent.includes('babylon') || pageContent.includes('BABYLON');
    
    // Check WebGL context with detailed diagnostics
    const webglInfo = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      document.body.appendChild(canvas);
      
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      const gl2 = canvas.getContext('webgl2');
      
      const result = {
        canvasCreated: true,
        webgl1Available: !!gl,
        webgl2Available: !!gl2,
        vendor: null,
        renderer: null,
        version: null,
        shadingLanguageVersion: null,
        maxTextureSize: null,
        error: null
      };
      
      const contextToUse = gl2 || gl;
      if (contextToUse) {
        try {
          const debugInfo = contextToUse.getExtension('WEBGL_debug_renderer_info');
          result.vendor = debugInfo ? contextToUse.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';
          result.renderer = debugInfo ? contextToUse.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
          result.version = contextToUse.getParameter(contextToUse.VERSION);
          result.shadingLanguageVersion = contextToUse.getParameter(contextToUse.SHADING_LANGUAGE_VERSION);
          result.maxTextureSize = contextToUse.getParameter(contextToUse.MAX_TEXTURE_SIZE);
        } catch (e) {
          result.error = e.message;
        }
      }
      
      document.body.removeChild(canvas);
      return result;
    });
    
    // Output results
    console.log('\n=== TEST RESULTS ===');
    
    console.log('\nPage Info:');
    console.log(JSON.stringify(pageInfo, null, 2));
    
    console.log('\nCanvas Element:');
    console.log(JSON.stringify(canvasExists, null, 2));
    
    console.log('\nLoading State:');
    console.log(JSON.stringify(loadingInfo, null, 2));
    
    console.log('\nRendering Info:');
    console.log(JSON.stringify(renderingInfo, null, 2));
    
    console.log('\nWebGL Info:');
    console.log(JSON.stringify(webglInfo, null, 2));
    
    console.log('\n3D Library Detection:');
    console.log('Has Three.js:', hasThreeJs);
    console.log('Has Babylon.js:', hasBabylonJs);
    
    console.log('\nConsole Messages (last 20):');
    consoleMessages.slice(-20).forEach(msg => {
      console.log(`[${msg.type}] ${msg.text}`);
    });
    
    console.log('\nErrors:');
    if (errors.length === 0) {
      console.log('No errors found!');
    } else {
      errors.forEach(err => console.log(`- ${err}`));
    }
    
    console.log('\nScreenshot saved to: world-webgl-test.png');
    console.log('\n===================');
    
    // Keep browser open for 5 seconds to inspect
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();
