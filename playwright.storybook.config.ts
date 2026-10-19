import { defineConfig, devices } from "@playwright/test";

// Storybook dev サーバー（pnpm storybook の 6076）と衝突しないよう、静的ビルドの配信は専用ポートで行う
const STORYBOOK_STATIC_PORT = 6106;
const STORYBOOK_URL = `http://127.0.0.1:${STORYBOOK_STATIC_PORT}`;

export default defineConfig({
  testDir: "./storybook-tests",
  fullyParallel: true,
  workers: 4,
  timeout: 600_000,
  expect: { timeout: 15_000 },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: STORYBOOK_URL,
    viewport: { width: 320, height: 1000 },
    actionTimeout: 15_000,
    navigationTimeout: 15_000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium" }],
  webServer: {
    command: `node scripts/storybook-static-server.mjs ${STORYBOOK_STATIC_PORT}`,
    url: `${STORYBOOK_URL}/index.json`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
