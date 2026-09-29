import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['json', { outputFile: 'e2e-results/results.json' }],
    ['html', { outputFolder: 'e2e-results/html', open: 'never' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'off',
    trace: 'off',
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // Ndërtim prodhimi, jo next dev: next dev kompajlon rrugët "just-in-time" (Turbopack),
    // gjë që e bën TC-15 (prag < 2000ms, kapitulli 3.5) të pabesueshëm në ekzekutimin e
    // parë "të ftohtë". next build parapërpilon çdo rrugë, kështu matjet e performancës
    // pasqyrojnë kushtet reale të prodhimit.
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
