import { defineConfig } from "@playwright/test";

// デプロイ後の本番検証。通常の E2E とは分け、実行ごとに専用のアカウント・メーカー・資材を作って片付ける。
// FARMILLE_RELEASE_TEST_URL=https://www.farmille.com FARMILLE_RELEASE_SECRET_FILE=<接続キーのファイル> pnpm exec playwright test --config playwright.release.config.ts
// 認証情報を残さないよう、trace・動画・自動スクリーンショットは保存しない。
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
