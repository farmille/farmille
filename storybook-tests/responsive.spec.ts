import path from "node:path";
import { expect, test } from "@playwright/test";
import type { APIRequestContext, Page, TestInfo } from "@playwright/test";
import * as v from "valibot";

const VIEWPORT_WIDTHS = [
  320, 360, 375, 390, 414, 480, 640, 767, 768, 900, 1024, 1280, 1440,
] as const;
const VIEWPORT_HEIGHT = 1000;
const OVERFLOW_TOLERANCE = 1;
const RENDER_TIMEOUT = 15_000;
const SHARD_COUNT = 4;
const MAX_REPORTED_FAILURES = 50;

const SCREENSHOT_WIDTHS = [375, 1440] as const;
const REPRESENTATIVE_STORY_IDS = [
  "app-admin-adminshell--default",
  "app-admin-materials-materialform--edit",
  "app-materials-detailtable--official",
  "app-materials-materialhero--signed-in",
  "app-materials-report-reportform--draft",
  "app-materials-reviewlist--default",
  "app-me-saved-comparetable--three-materials",
  "app-me-shelves--all-sections",
  "app-sellers-manufacturerlanding--default",
] as const;

const StoryIndexEntrySchema = v.object({
  id: v.string(),
  name: v.string(),
  title: v.string(),
  type: v.picklist(["story", "docs"]),
});
const StoryIndexSchema = v.object({
  entries: v.record(v.string(), StoryIndexEntrySchema),
});
type StoryIndexEntry = v.InferOutput<typeof StoryIndexEntrySchema>;

type OverflowDetails = {
  viewportWidth: number;
  documentWidth: number;
  overflowBy: number;
  offenders: Array<{
    tag: string;
    className: string;
    text: string;
    left: number;
    right: number;
    width: number;
  }>;
};

type ResponsiveFailure = {
  storyId: string;
  storyTitle: string;
  width: number;
  reason: string;
  details?: string | OverflowDetails;
};

async function fetchSortedStories(request: APIRequestContext): Promise<StoryIndexEntry[]> {
  const indexResponse = await request.get("/index.json");
  expect(indexResponse.ok(), "Storybook の index.json を取得できること").toBe(true);

  const result = v.safeParse(StoryIndexSchema, await indexResponse.json());
  if (!result.success) {
    throw new Error(`Storybook の index.json が不正です：${v.summarize(result.issues)}`);
  }

  return Object.values(result.output.entries)
    .filter((entry) => entry.type === "story")
    .toSorted((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
}

// 「何も描画しない」ことが仕様の Story。Pagination は1ページ以下・MetricBars は0件で非表示。
const NULL_RENDER_STORY_IDS: ReadonlySet<string> = new Set([
  "app-materials-ratingsummary--no-reviews",
  "components-metricbars--empty",
  "components-pagination--single-page",
]);

async function gotoStory(page: Page, storyId: string): Promise<void> {
  await page.goto(`/iframe.html?id=${encodeURIComponent(storyId)}&viewMode=story`, {
    waitUntil: "domcontentloaded",
  });
  // Storybook は描画完了で sb-show-main、失敗で sb-show-errordisplay を body に付ける
  await page.waitForFunction(
    () =>
      document.body.classList.contains("sb-show-main") ||
      document.body.classList.contains("sb-show-errordisplay"),
    undefined,
    { timeout: RENDER_TIMEOUT },
  );

  // 非同期サーバーコンポーネントの Story は sb-show-main の後にコンテンツが実マウントされる。
  // 空 DOM への空振り検査を防ぐため、null 描画が仕様の Story 以外は実マウントまで待つ。
  if (!NULL_RENDER_STORY_IDS.has(storyId)) {
    await page.waitForFunction(
      () => {
        if (document.body.classList.contains("sb-show-errordisplay")) return true;
        const root = document.querySelector("#storybook-root");
        return root !== null && root.childNodes.length > 0;
      },
      undefined,
      { timeout: RENDER_TIMEOUT },
    );
  }

  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

function resolveScreenshotDirectory(testInfo: TestInfo): string {
  const configFile = testInfo.config.configFile;
  if (configFile === undefined) {
    throw new Error(
      "Playwright 設定ファイルのパスを解決できず、スクリーンショットの保存先を決められません。",
    );
  }
  return path.join(path.dirname(configFile), "output", "playwright", "storybook-responsive");
}

function readStoryError(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const error = document.querySelector("#error-message, .sb-errordisplay");
    if (error === null) return null;

    const style = getComputedStyle(error);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      error.getBoundingClientRect().height === 0
    ) {
      return null;
    }
    return error.textContent;
  });
}

async function collectResponsiveFailures(
  page: Page,
  stories: StoryIndexEntry[],
): Promise<ResponsiveFailure[]> {
  const failures: ResponsiveFailure[] = [];
  let currentStory: StoryIndexEntry | null = null;
  let currentWidth: number = VIEWPORT_WIDTHS[0];

  page.on("pageerror", (error) => {
    if (currentStory === null) return;
    failures.push({
      storyId: currentStory.id,
      storyTitle: `${currentStory.title} / ${currentStory.name}`,
      width: currentWidth,
      reason: "ブラウザ実行時エラー",
      details: error.message,
    });
  });

  for (const story of stories) {
    currentStory = story;
    currentWidth = VIEWPORT_WIDTHS[0];
    await page.setViewportSize({ width: currentWidth, height: VIEWPORT_HEIGHT });

    try {
      await gotoStory(page, story.id);
    } catch (error) {
      failures.push({
        storyId: story.id,
        storyTitle: `${story.title} / ${story.name}`,
        width: currentWidth,
        reason: "Story を描画できない",
        details: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    const storyError = await readStoryError(page);
    if (storyError !== null) {
      failures.push({
        storyId: story.id,
        storyTitle: `${story.title} / ${story.name}`,
        width: currentWidth,
        reason: "Storybook 描画エラー",
        details: storyError.trim(),
      });
      continue;
    }

    for (const width of VIEWPORT_WIDTHS) {
      currentWidth = width;
      await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
      await page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          }),
      );

      const overflow = await page.evaluate((tolerance) => {
        const viewportWidth = document.documentElement.clientWidth;
        const documentWidth = Math.max(
          document.documentElement.scrollWidth,
          document.body.scrollWidth,
        );

        if (documentWidth <= viewportWidth + tolerance) return null;

        const root = document.querySelector("#storybook-root");
        const elements = root === null ? [] : Array.from(root.querySelectorAll<HTMLElement>("*"));
        const offenders = elements
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              element,
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
            };
          })
          .filter(({ element, left, right, width }) => {
            if (width <= 1 || (left >= -tolerance && right <= viewportWidth + tolerance)) {
              return false;
            }

            const style = getComputedStyle(element);
            return (
              style.display !== "none" && style.visibility !== "hidden" && style.clipPath === "none"
            );
          })
          .toSorted((left, right) => right.right - left.right)
          .slice(0, 5)
          .map(({ element, left, right, width }) => ({
            tag: element.tagName.toLowerCase(),
            className: element.className,
            text: element.textContent?.trim().slice(0, 80) ?? "",
            left,
            right,
            width,
          }));

        return {
          viewportWidth,
          documentWidth,
          overflowBy: documentWidth - viewportWidth,
          offenders,
        };
      }, OVERFLOW_TOLERANCE);

      if (overflow !== null) {
        failures.push({
          storyId: story.id,
          storyTitle: `${story.title} / ${story.name}`,
          width,
          reason: "画面全体に横スクロールが発生",
          details: overflow,
        });
      }
    }
  }

  currentStory = null;
  return failures;
}

for (let shardIndex = 0; shardIndex < SHARD_COUNT; shardIndex += 1) {
  test(`全 Story が段階的な画面幅で横にはみ出さない（shard ${shardIndex + 1}/${SHARD_COUNT}）`, async ({
    page,
    request,
  }, testInfo) => {
    const allStories = await fetchSortedStories(request);
    const stories = allStories.filter((_, index) => index % SHARD_COUNT === shardIndex);
    expect(stories.length, "shard に検査対象の Story が割り当てられること").toBeGreaterThan(0);

    const failures = await collectResponsiveFailures(page, stories);

    await testInfo.attach("responsive-results", {
      body: JSON.stringify(
        {
          shard: `${shardIndex + 1}/${SHARD_COUNT}`,
          storiesInIndex: allStories.length,
          storiesInShard: stories.length,
          widths: VIEWPORT_WIDTHS,
          checks: stories.length * VIEWPORT_WIDTHS.length,
          failures,
        },
        null,
        2,
      ),
      contentType: "application/json",
    });

    expect(
      failures.length,
      `${stories.length} Story × ${VIEWPORT_WIDTHS.length}画面幅の検査結果（先頭${MAX_REPORTED_FAILURES}件まで表示）:\n${JSON.stringify(failures.slice(0, MAX_REPORTED_FAILURES), null, 2)}`,
    ).toBe(0);
  });
}

test("自分のレビューの操作ボタンが狭い画面でも収まる", async ({ page }, testInfo) => {
  for (const width of [320, 360, 375]) {
    await page.setViewportSize({ width, height: 812 });
    await gotoStory(page, "components-reviewcard--own-review");
    await expect(page.getByRole("button", { name: "削除", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width + OVERFLOW_TOLERANCE,
    );
    if (width === 375) {
      await page.screenshot({
        path: path.join(resolveScreenshotDirectory(testInfo), "review-own-375.png"),
        fullPage: true,
      });
    }
  }
});

test("BottomNav は tab 未満で固定され、tab 以上では非表示になる", async ({ page }) => {
  const storyId = "components-bottomnav--viewport-fixed";
  await page.setViewportSize({ width: 375, height: 812 });
  await gotoStory(page, storyId);

  const navigation = page.getByRole("navigation", { name: "メインナビ" });
  await expect(navigation).toBeVisible();
  await expect(navigation).toHaveCSS("position", "fixed");

  const bottomGap = () =>
    navigation.evaluate((element) => window.innerHeight - element.getBoundingClientRect().bottom);

  expect(Math.abs(await bottomGap()), "初期位置で画面下端に接すること").toBeLessThanOrEqual(1);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  expect(Math.abs(await bottomGap()), "スクロール後も画面下端に接すること").toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 640, height: 1024 });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
  await expect(navigation).toBeVisible();
  await expect(navigation).toHaveCSS("position", "fixed");

  await page.setViewportSize({ width: 767, height: 900 });
  await expect(navigation).toBeVisible();
  await expect(navigation).toHaveCSS("position", "fixed");

  await page.setViewportSize({ width: 768, height: 900 });
  await expect(navigation).toBeHidden();
});

test("AppBar は tab 境界でモバイル版と PC 版を相互排他にする", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await gotoStory(page, "components-appbar--home");

  const mobileAppBar = page.locator('[data-ui="mobile-app-bar"]');
  const desktopSiteHeader = page.locator('[data-ui="desktop-site-header"]');
  await expect(mobileAppBar).toBeVisible();
  await expect(desktopSiteHeader).toBeHidden();

  await page.setViewportSize({ width: 767, height: 900 });
  await expect(mobileAppBar).toBeVisible();
  await expect(desktopSiteHeader).toBeHidden();

  await page.setViewportSize({ width: 768, height: 900 });
  await expect(mobileAppBar).toBeHidden();
  await expect(desktopSiteHeader).toBeVisible();
});

test("FormPageShell は PC で用途別の有限幅を持つ", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoStory(page, "components-formpageshell--default");

  const main = page.locator("main");
  await expect(main).toHaveCSS("max-width", "704px");
  expect(await main.evaluate((element) => element.getBoundingClientRect().width)).toBeLessThan(
    1440,
  );
});

test("画像枠は画面幅が変わっても用途別のアスペクト比を維持する", async ({ page }) => {
  const cases = [
    {
      storyId: "components-materialcard--scroll",
      selector: '[data-ui="material-card-image"]',
      expectedRatio: 4 / 3,
    },
    {
      storyId: "components-materialcard--list",
      selector: '[data-ui="material-card-image"]',
      expectedRatio: 1,
    },
    {
      storyId: "components-reportcard--scroll",
      selector: '[data-ui="report-card-image"]',
      expectedRatio: 4 / 3,
    },
    {
      storyId: "components-reportcard--grid-with-cover",
      selector: '[data-ui="report-card-image"]',
      expectedRatio: 16 / 9,
    },
    {
      storyId: "components-reportcard--list-with-cover",
      selector: '[data-ui="report-card-image"]',
      expectedRatio: 16 / 9,
    },
    {
      storyId: "components-articlecard--with-cover",
      selector: '[data-ui="article-card-image"]',
      expectedRatio: 16 / 9,
    },
  ] as const;

  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });

    for (const testCase of cases) {
      await gotoStory(page, testCase.storyId);
      const frame = page.locator(testCase.selector);
      await expect(frame).toBeVisible();

      const measuredRatio = await frame.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width / rect.height;
      });

      expect(
        Math.abs(measuredRatio - testCase.expectedRatio),
        `${testCase.storyId}（${width}px）の画像比率が固定されること`,
      ).toBeLessThan(0.01);
    }
  }
});

test("横送り用の資材カードはPCで過度に拡大しない", async ({ page }) => {
  const cases = [
    { width: 375, expectedCardWidth: 150 },
    { width: 768, expectedCardWidth: 240 },
    { width: 1440, expectedCardWidth: 240 },
  ] as const;

  for (const testCase of cases) {
    await page.setViewportSize({ width: testCase.width, height: VIEWPORT_HEIGHT });
    await gotoStory(page, "components-materialcard--scroll");

    const card = page.locator('[data-ui="material-card"][data-variant="scroll"]');
    await expect(card).toBeVisible();
    await expect(card).toHaveCSS("width", `${testCase.expectedCardWidth}px`);
  }
});

test("代表的な複雑 Story のスクリーンショットを 375px と 1440px で保存する", async ({
  page,
  request,
}, testInfo) => {
  const stories = await fetchSortedStories(request);
  const storiesById = new Map(stories.map((story) => [story.id, story]));
  const outputDirectory = resolveScreenshotDirectory(testInfo);

  for (const storyId of REPRESENTATIVE_STORY_IDS) {
    expect(storiesById.has(storyId), `代表 Story ${storyId} が index.json に存在すること`).toBe(
      true,
    );

    for (const width of SCREENSHOT_WIDTHS) {
      await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
      await gotoStory(page, storyId);

      const storyError = await readStoryError(page);
      expect(storyError, `${storyId}（${width}px）が描画エラーなく表示されること`).toBeNull();

      await page.screenshot({
        path: path.join(outputDirectory, `${storyId}--${width}px.png`),
        fullPage: true,
      });
    }
  }
});

test("口コミ0件の評価サマリーは表示しない", async ({ page }) => {
  await gotoStory(page, "app-materials-ratingsummary--default");
  await expect(page.locator("#storybook-root")).toContainText("18件");
  await gotoStory(page, "app-materials-ratingsummary--no-reviews");
  await expect(page.locator("#storybook-root")).toBeEmpty();
});
