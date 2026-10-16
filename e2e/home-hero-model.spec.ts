import { chromium, expect, test, type Page } from "@playwright/test";

const MODEL = '[data-ui="home-hero-model"]';
/** CI の WebGL はソフトウェア描画なので、three.js の読み込みと最初の1枚に時間がかかる。 */
const FIRST_FRAME_TIMEOUT = 30_000;

async function waitForModel(page: Page): Promise<void> {
  // 下に敷いた写真が読み込みで差し替わると、ボトルと関係なく canvas の範囲の絵が変わる
  await expect(page.locator('section[aria-labelledby="home-heading"] img')).toHaveJSProperty(
    "complete",
    true,
  );
  const model = page.locator(MODEL);
  await expect(model).toHaveAttribute("aria-hidden", "true");
  await expect(model).toHaveAttribute("data-ready", "", { timeout: FIRST_FRAME_TIMEOUT });
  await expect(model).toHaveCSS("opacity", "1");
}

function canvasFrame(page: Page): Promise<Buffer> {
  return page.locator(`${MODEL} canvas`).screenshot();
}

test("ホームのヒーローで BS 資材のボトルが回る", async ({ page }) => {
  await page.goto("/");
  await waitForModel(page);

  const before = await canvasFrame(page);
  await expect.poll(async () => (await canvasFrame(page)).equals(before)).toBe(false);
});

test.describe("動きを減らす設定", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("ボトルを回さず、止まった1枚を描く", async ({ page }) => {
    await page.goto("/");
    await waitForModel(page);

    const before = await canvasFrame(page);
    // 回っていないことは、時間を置いても同じ絵であることでしか確かめられない
    await page.waitForTimeout(1_000);
    expect((await canvasFrame(page)).equals(before)).toBe(true);
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
