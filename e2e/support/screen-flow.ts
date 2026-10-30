import { expect, type Page } from "@playwright/test";

export async function captureScreenFlow(
  page: Page,
  filename: string,
  fullPage = true,
): Promise<void> {
  const originalViewport = page.viewportSize();

  if (originalViewport === null) throw new Error("撮影用の画面サイズが設定されていません");

  try {
    for (const device of [
      { directory: "", width: 375, height: 812 },
      { directory: "pc/", width: 1280, height: 900 },
    ]) {
      await page.setViewportSize({ width: device.width, height: device.height });
      await expect(page.getByText("読み込んでいます", { exact: true })).toHaveCount(0);
      await page.screenshot({
        path: `docs/rebuild/assets/account-flow/screens/${device.directory}${filename}`,
        fullPage,
        animations: "disabled",
      });
    }
  } finally {
    await page.setViewportSize(originalViewport);
  }
}
