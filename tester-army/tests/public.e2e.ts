import { test } from "@e2e-dev/web";
import { expect } from "e2e";
import { legalDocuments } from "../../src/content/legal/documents";
import { materialTest } from "../support/fixtures";

for (const path of ["/", "/search", "/articles", "/sellers", "/signup", "/legal"]) {
  test(`公開ページ${path}を375pxで閲覧する`, async ({ app, screen, browser }) => {
    await app.open(path);
    await expect(browser).toHaveURL(path);
    await expect(screen.getByRole("main")).toBeVisible();
    await expect(screen.getByRole("heading", { level: 1 })).toBeVisible();
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

for (const path of [
  "/unknown-e2e-page",
  "/legal/unknown-e2e-document",
  "/materials/00000000-0000-4000-8000-000000000000",
  "/reports/00000000-0000-4000-8000-000000000000",
  "/articles/00000000-0000-4000-8000-000000000000",
  "/users/00000000-0000-4000-8000-000000000000",
  "/sellers/00000000-0000-4000-8000-000000000000",
]) {
  test(`存在しない${path}に日本語の404を表示する`, async ({ app, screen }) => {
    await app.open(path);
    await expect(screen.getByRole("heading", "ページが見つかりません")).toBeVisible();
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
