import { test } from "@e2e-dev/web";
import { expect } from "e2e";
import { legalDocuments } from "../../src/content/legal/documents";
import { materialTest } from "../support/fixtures";

for (const path of ["/", "/search", "/articles", "/sellers", "/signup", "/legal"]) {
  test(`公開ページ${path}を375pxで閲覧する`, async ({ app, screen, browser }) => {
    await app.open(path);
    await expect(browser).toHaveURL(path);
    const main = screen.getByRole("main");
    await expect(main).toBeVisible();
    await expect(
      path === "/"
        ? main.getByRole("heading", "掲載資材一覧", { level: 1 })
        : main.getByRole("heading", { level: 1 }),
    ).toBeVisible();
    await expect(screen.getByText("ページを表示できませんでした")).toHaveCount(0);
    expect(
      await browser.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await app.screenshot(`public-${path.replaceAll("/", "-")}`);
  });
}

for (const document of legalDocuments) {
  test(`規約${document.slug}の本文と一覧への戻り先を確認する`, async ({ app, screen, browser }) => {
    await app.open(`/legal/${document.slug}`);
    await expect(screen.getByRole("heading", document.title, { level: 1 })).toBeVisible();
    await screen.getByRole("link", "規約・ガイドライン一覧へ").tap();
    await expect(browser).toHaveURL("/legal");
  });
}

for (const [path, title, description] of [
  [
    "/unknown-e2e-page",
    "ページが見つかりません",
    "指定されたページは存在しないか、移動した可能性があります。",
  ],
  [
    "/legal/unknown-e2e-document",
    "ページが見つかりません",
    "指定されたページは存在しないか、移動した可能性があります。",
  ],
  [
    "/materials/00000000-0000-4000-8000-000000000000",
    "資材が見つかりません",
    "指定された資材は存在しないか、公開が終了した可能性があります。",
  ],
  [
    "/reports/00000000-0000-4000-8000-000000000000",
    "ページが見つかりません",
    "指定されたページは存在しないか、移動した可能性があります。",
  ],
  [
    "/articles/00000000-0000-4000-8000-000000000000",
    "ページが見つかりません",
    "指定されたページは存在しないか、移動した可能性があります。",
  ],
  [
    "/users/00000000-0000-4000-8000-000000000000",
    "プロフィールが見つかりません",
    "指定されたユーザーは存在しないか、プロフィールを利用できません。",
  ],
  [
    "/sellers/00000000-0000-4000-8000-000000000000",
    "メーカーが見つかりません",
    "指定されたメーカーは存在しないか、現在公開されていません。",
  ],
]) {
  test(`存在しない${path}に日本語の404を表示する`, async ({ app, screen, browser }) => {
    await app.open(path);
    await expect(browser).toHaveURL(path);
    const main = screen.getByRole("main");
    await expect(main).toBeVisible();
    await expect(main.getByText(title)).toBeVisible();
    await expect(main.getByText(description)).toBeVisible();
    await expect(screen.getByText("ページを表示できませんでした")).toHaveCount(0);
    const home = main.getByRole("link", "ホームへ戻る");
    await expect(home).toHaveAttribute("href", "/");
    await home.tap();
    await expect(browser).toHaveURL("/");
    await expect(screen.getByRole("main").getByRole("heading", "掲載資材一覧")).toBeVisible();
  });
}

materialTest(
  "資材詳細から口コミと関連記事を閲覧する",
  async ({ app, screen, browser, material }) => {
    for (const suffix of ["", "/reviews", "/articles"]) {
      await app.open(`/materials/${material.id}${suffix}`);
      await expect(browser).toHaveURL(`/materials/${material.id}${suffix}`);
      await expect(screen.getByRole("main")).toContainText(material.name);
      await expect(screen.getByText("ページを表示できませんでした")).toHaveCount(0);
    }
  },
);
