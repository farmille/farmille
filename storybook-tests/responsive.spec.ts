import path from "node:path";
import { expect, test } from "@playwright/test";
import type { APIRequestContext, Page, TestInfo } from "@playwright/test";
import * as v from "valibot";
import type { StorySelection } from "../tools/ci/selection.ts";
import { selectStoryFiles, StorySelectionSchema } from "../tools/ci/selection.ts";

const VIEWPORT_WIDTHS = [
  320, 360, 375, 390, 414, 480, 640, 767, 768, 900, 1024, 1280, 1440,
] as const;
const VIEWPORT_HEIGHT = 1000;
const OVERFLOW_TOLERANCE = 1;
const RENDER_TIMEOUT = 15_000;
// 全 Story をこの数のテストに分ける。1 テストを timeout（600 秒）に収め、CI の各 shard は自分の分のテストだけを流す。
const CHUNK_COUNT = 12;
const MAX_REPORTED_FAILURES = 50;

// CI の matrix で Story の検査を複数ジョブに分ける。未指定なら 1 ジョブで全 Story を検査する。
const CiShardSchema = v.pipe(
  v.string(),
  v.regex(
    /^[1-9]\d*\/[1-9]\d*$/,
    "STORYBOOK_RESPONSIVE_SHARD は <current>/<total> の形式で指定する",
  ),
  v.transform((value) => {
    const [current, total] = value.split("/");
    return { current: Number(current), total: Number(total) };
  }),
  v.check(
    ({ current, total }) => current <= total,
    "STORYBOOK_RESPONSIVE_SHARD の current は total 以下にする",
  ),
  v.check(
    ({ total }) => total <= CHUNK_COUNT,
    `STORYBOOK_RESPONSIVE_SHARD の total は ${CHUNK_COUNT} 以下にする`,
  ),
);
type CiShard = v.InferOutput<typeof CiShardSchema>;

function resolveCiShard(): CiShard {
  const raw = process.env.STORYBOOK_RESPONSIVE_SHARD;
  return raw === undefined ? { current: 1, total: 1 } : v.parse(CiShardSchema, raw);
}

const CI_SHARD = resolveCiShard();
const selectionInput = process.env.STORYBOOK_RESPONSIVE_SELECTION;
const STORY_SELECTION: StorySelection =
  selectionInput === undefined
    ? { mode: "all", reason: "ローカル実行は全件検査" }
    : v.parse(StorySelectionSchema, JSON.parse(selectionInput));

// 個別部品の検査は CI の最初の shard だけが受け持つ。2 番目以降は全 Story の検査に専念する。
function skipUnlessFirstShard(): void {
  test.skip(CI_SHARD.current !== 1, "CI では shard 1 だけで検査する");
}

const SCREENSHOT_WIDTHS = [375, 1440] as const;
const REPRESENTATIVE_STORY_IDS = [
  "pages-admin-adminshell--default",
  "pages-admin-materials-materialform--edit",
  "pages-materials-id-detailtable--official",
  "pages-materials-id-materialhero--signed-in",
  "pages-materials-id-report-reportpageform--draft",
  "pages-materials-id-materialreviewssection--default",
  "pages-me-saved-compare-comparetable--three-materials",
  "pages-me-shelves--all-sections",
  "pages-sellers-manufacturerlanding--default",
] as const;

const StoryIndexEntrySchema = v.object({
  id: v.string(),
  name: v.string(),
  title: v.string(),
  importPath: v.string(),
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
  "pages-materials-id-ratingsummary--no-reviews",
  "components-display-metricbars--empty",
  "components-navigation-pagination--single-page",
  "pages-materials-id-report-reportpdfpagepicker--closed",
  // 初回ログインの案内は、印（localStorage）と一般会員のセッションがないときは何も描かない
  "pages-shared-onboardingtour--without-mark",
  "pages-signup-done-onboardingarm--default",
]);

// Pages 配下にはルート画面の Story と、画面に依存する部品の Story が混在する。
// 非同期画面の描画完了を待つのは、ルート画面（Page・Error・NotFound）の Story だけにする。
function isAsyncScreenStory(story: StoryIndexEntry): boolean {
  return /\/(Page|Error|NotFound)\.stories\.tsx$/.test(story.importPath);
}

async function gotoStory(
  page: Page,
  storyId: string,
  settleAsyncScreen: boolean = false,
): Promise<void> {
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
        if (root !== null && root.childNodes.length > 0) return true;
        // ダイアログは body 直下へ portal されるので、開いたダイアログだけを描く Story は root が空のまま
        return document.querySelector('[role="dialog"], [role="alertdialog"]') !== null;
      },
      undefined,
      { timeout: RENDER_TIMEOUT },
    );
  }

  if (settleAsyncScreen) {
    await page.waitForFunction(
      () =>
        document.body.classList.contains("sb-show-errordisplay") ||
        document.querySelector('#storybook-root [aria-busy="true"]') === null,
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
      await gotoStory(page, story.id, isAsyncScreenStory(story));
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

for (let chunkIndex = 0; chunkIndex < CHUNK_COUNT; chunkIndex += 1) {
  if (chunkIndex % CI_SHARD.total !== CI_SHARD.current - 1) continue;

  test(`全 Story が段階的な画面幅で横にはみ出さない（CI shard ${CI_SHARD.current}/${CI_SHARD.total}・chunk ${chunkIndex + 1}/${CHUNK_COUNT}）`, async ({
    page,
    request,
  }, testInfo) => {
    const allStories = await fetchSortedStories(request);
    const selectedFiles = selectStoryFiles(
      STORY_SELECTION,
      allStories.map((story) => story.importPath),
    );
    const selectedStories = allStories.filter((story) =>
      selectedFiles.has(story.importPath.replace(/^\.\//, "")),
    );
    const stories = selectedStories.filter((_, index) => index % CHUNK_COUNT === chunkIndex);
    // 少数の Story を選んだ PR では空の chunk がある。manifest の照合後にだけ省く。
    test.skip(
      STORY_SELECTION.mode === "selected" && stories.length === 0,
      "この chunk への割り当てなし",
    );
    expect(stories.length, "chunk に検査対象の Story が割り当てられること").toBeGreaterThan(0);

    const failures = await collectResponsiveFailures(page, stories);

    await testInfo.attach("responsive-results", {
      body: JSON.stringify(
        {
          ciShard: `${CI_SHARD.current}/${CI_SHARD.total}`,
          chunk: `${chunkIndex + 1}/${CHUNK_COUNT}`,
          storiesInIndex: allStories.length,
          storiesSelected: selectedStories.length,
          storiesInChunk: stories.length,
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
  skipUnlessFirstShard();
  for (const width of [320, 360, 375]) {
    await page.setViewportSize({ width, height: 812 });
    await gotoStory(page, "pages-shared-reviewcard--own-review");
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
  skipUnlessFirstShard();
  const storyId = "pages-shared-bottomnav--viewport-fixed";
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
  skipUnlessFirstShard();
  await page.setViewportSize({ width: 375, height: 812 });
  await gotoStory(page, "pages-shared-appbar--home");

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
  skipUnlessFirstShard();
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoStory(page, "components-layout-formpageshell--default");

  const main = page.locator("main");
  await expect(main).toHaveCSS("max-width", "704px");
  expect(await main.evaluate((element) => element.getBoundingClientRect().width)).toBeLessThan(
    1440,
  );
});

test("画像枠は画面幅が変わっても用途別のアスペクト比を維持する", async ({ page }) => {
  skipUnlessFirstShard();
  const cases = [
    {
      storyId: "pages-shared-materialcard--scroll",
      selector: '[data-ui="material-card-image"]',
      expectedRatio: 4 / 3,
    },
    {
      storyId: "pages-shared-materialcard--list",
      selector: '[data-ui="material-card-image"]',
      expectedRatio: 1,
    },
    {
      storyId: "pages-shared-materialcard--rich",
      selector: '[data-ui="material-card-image"]',
      expectedRatio: 1,
    },
    {
      storyId: "pages-shared-reportcard--scroll",
      selector: '[data-ui="report-card-image"]',
      expectedRatio: 4 / 3,
    },
    {
      storyId: "pages-shared-reportcard--grid-with-cover",
      selector: '[data-ui="report-card-image"]',
      expectedRatio: 16 / 9,
    },
    {
      storyId: "pages-shared-reportcard--list-with-cover",
      selector: '[data-ui="report-card-image"]',
      expectedRatio: 16 / 9,
    },
    {
      storyId: "pages-shared-articlecard--with-cover",
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
  skipUnlessFirstShard();
  const cases = [
    { width: 375, expectedCardWidth: 150 },
    { width: 768, expectedCardWidth: 240 },
    { width: 1440, expectedCardWidth: 240 },
  ] as const;

  for (const testCase of cases) {
    await page.setViewportSize({ width: testCase.width, height: VIEWPORT_HEIGHT });
    await gotoStory(page, "pages-shared-materialcard--scroll");

    const card = page.locator('[data-ui="material-card"][data-variant="scroll"]');
    await expect(card).toBeVisible();
    await expect(card).toHaveCSS("width", `${testCase.expectedCardWidth}px`);
  }
});

test("代表的な複雑 Story のスクリーンショットを 375px と 1440px で保存する", async ({
  page,
  request,
}, testInfo) => {
  skipUnlessFirstShard();
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
  skipUnlessFirstShard();
  await gotoStory(page, "pages-materials-id-ratingsummary--default");
  await expect(page.locator("#storybook-root")).toContainText("18件");
  await gotoStory(page, "pages-materials-id-ratingsummary--no-reviews");
  await expect(page.locator("#storybook-root")).toBeEmpty();
});
