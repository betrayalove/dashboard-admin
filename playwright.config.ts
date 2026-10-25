import { defineConfig, devices } from '@playwright/test';
const frontendPort = process.env.FRONTEND_PORT || '5373';
const backendPort = process.env.BACKEND_PORT || '3181';
const frontend = `http://127.0.0.1:${frontendPort}`;
const backend = `http://127.0.0.1:${backendPort}`;
export default defineConfig({
  testDir: './e2e', fullyParallel: false, forbidOnly: !!process.env.CI,
  retries: 0, workers: 1, timeout: 30000, reporter: 'list',
  use: { baseURL: frontend, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    { command: 'npm run server', url: `${backend}/health`, reuseExistingServer: false,
      env: { PORT: backendPort, ALLOWED_ORIGINS: frontend, DATA_FILE: `.data/e2e-${process.pid}.json`, NODE_ENV: 'test' } },
    { command: process.env.E2E_PREVIEW === '1' ? `npm run preview -- --host 127.0.0.1 --port ${frontendPort} --strictPort` : 'npm run dev -- --strictPort', url: frontend, reuseExistingServer: false,
      env: { FRONTEND_PORT: frontendPort, API_TARGET: backend } },
  ],
});
