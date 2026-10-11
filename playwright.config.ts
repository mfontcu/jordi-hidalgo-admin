import { defineConfig, devices } from '@playwright/test';

const port = 4173;
// Set PLAYWRIGHT_BASE_URL to test a running deployment, e.g. the Docker image on localhost.
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

// By default runs against the production build (`npm run build:e2e`), served by `vite preview`.
export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: externalBaseUrl ?? `http://localhost:${port}`,
    trace: 'retain-on-failure',
  },
  // Chromium starts in en-US; the panel's tests expect the Spanish a browser in Spain gets. A test
  // about language detection sets its own locale.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], locale: 'es-ES' } }],
  ...(externalBaseUrl
    ? {}
    : {
        webServer: {
          command: `npx vite preview --mode e2e --port ${port} --strictPort`,
          url: `http://localhost:${port}`,
          reuseExistingServer: !process.env.CI,
        },
      }),
});
