import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:10086',
    headless: true,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        viewport: {
          width: 390,
          height: 844,
        },
        launchOptions: {
          args: [
            '--enable-webgl',
            '--ignore-gpu-blocklist',
            '--use-angle=swiftshader',
          ],
        },
      },
    },
  ],
  webServer: {
    command: 'npm run dev:h5',
    url: 'http://127.0.0.1:10086',
    timeout: 180_000,
    reuseExistingServer: true,
  },
});
