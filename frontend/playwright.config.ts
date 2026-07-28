import { defineConfig, devices } from "@playwright/test";

const BASE_URL = "http://127.0.0.1:3007";
const LOCAL_SUPABASE_ORIGIN = "http://127.0.0.1:54321";
const useExternalWebServer = process.env.PLAYWRIGHT_EXTERNAL_WEB_SERVER === "1";

function requireEnv(name: string): string {
  const value = process.env[name];

  if (value === undefined || value.length === 0) {
    throw new Error(`E2E に必要な環境変数 ${name} が設定されていません。`);
  }

  return value;
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
requireEnv("SUPABASE_SERVICE_ROLE_KEY");

if (new URL(supabaseUrl).origin !== LOCAL_SUPABASE_ORIGIN) {
  throw new Error(`E2E はローカル Supabase（${LOCAL_SUPABASE_ORIGIN}）に対してのみ実行できます。`);
}

// Next.js の本番ビルドと Server Actions の同一オリジンを 3007 に固定する。
process.env.NEXT_PUBLIC_SITE_URL = BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "on",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 812 },
      },
    },
  ],
  webServer: useExternalWebServer
    ? undefined
    : {
        command: "pnpm build && pnpm start --port 3007",
        url: BASE_URL,
        reuseExistingServer: false,
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
