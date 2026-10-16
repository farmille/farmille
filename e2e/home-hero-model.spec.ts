import { chromium, expect, test, type Page } from "@playwright/test";

const MODEL = '[data-ui="home-hero-model"]';
/** CI の WebGL はソフトウェア描画なので、最初の1枚に時間がかかる。 */
const FIRST_FRAME_TIMEOUT = 30_000;

async function waitForModel(page: Page): Promise<void> {
  const model = page.locator(MODEL);
  await expect(model).toHaveAttribute("aria-hidden", "true");
  await expect(model).toHaveAttribute("data-ready", "", { timeout: FIRST_FRAME_TIMEOUT });
  await expect(model).toHaveCSS("opacity", "1");
}

function screenshotBottle(page: Page): Promise<Buffer> {
  return page.locator(`${MODEL} canvas`).screenshot({
    style: `section[aria-labelledby="home-heading"] { visibility: hidden; } ${MODEL} canvas { visibility: visible; }`,
  });
}

test("ホームのヒーローで BS 資材のボトルが回る", async ({ page }) => {
  await page.goto("/");
  await waitForModel(page);

  const before = await screenshotBottle(page);
  await expect.poll(async () => (await screenshotBottle(page)).equals(before)).toBe(false);
});

test.describe("動きを減らす設定", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("ボトルを回さず、止まった1枚を描く", async ({ page }) => {
    await page.goto("/");
    await waitForModel(page);

    const before = await screenshotBottle(page);
    await page.clock.runFor(1_000);
    expect((await screenshotBottle(page)).equals(before)).toBe(true);
  });
});

test("WebGL が使えない端末では、ボトルを出さずに写真のヒーローのまま使える", async ({
  baseURL,
}) => {
  const browser = await chromium.launch({ args: ["--disable-webgl", "--disable-webgl2"] });
  try {
    const page = await browser.newPage({ baseURL, viewport: { width: 375, height: 812 } });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/", { waitUntil: "networkidle" });

    await expect(page.getByRole("search", { name: "資材検索" })).toBeVisible();
    await expect(page.locator(MODEL)).not.toHaveAttribute("data-ready");
    expect(errors).toEqual([]);
  } finally {
    await browser.close();
  }
});
