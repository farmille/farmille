import { defineConfig } from "@playwright/test";

const baseURL = process.env.FARMILLE_RELEASE_TEST_URL;
if (
  baseURL !== "https://www.farmille.com" &&
  baseURL !== "https://farmille-git-rebuild-m0-farmille.vercel.app"
) {
  throw new Error("検証対象の本番またはrebuild/m0のURLを明示してください");
}

export default defineConfig({
  testDir: "./tests/release",
  workers: 1,
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 30_000 },
  outputDir: "test-results/release",
  use: {
    baseURL,
    viewport: { width: 375, height: 812 },
    browserName: "chromium",
    actionTimeout: 30_000,
    navigationTimeout: 30_000,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
});
