import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import { createGeneralUser, deleteAuthUsersByEmail } from "./support/test-data";
import { loginGeneral } from "./support/ui";

const ADMIN_PAGE_TITLES =
  /運営管理|資材の編集|メーカー確認|メーカーの申請内容|実証詳細レポート編集/;

async function expectPublicNotFound(page: Page, path: string): Promise<void> {
  const response = await page.goto(path);

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "ページが見つかりません" }).first()).toBeVisible();
}

async function expectNoAdminTrace(page: Page): Promise<void> {
  await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);
  await expect(page).not.toHaveTitle(ADMIN_PAGE_TITLES);
  // RSC ペイロード（インラインスクリプト）も含めた HTML 全体に運営画面の文言が無いこと。
  const html = await page.content();
  expect(html).not.toContain("運営管理");
  expect(html).not.toContain("/admin/tags");
}

test("一般ユーザーには運営画面の痕跡が無い 404 を返す", async ({ page }) => {
  const user = await createGeneralUser("admin-not-found");

  try {
    await loginGeneral(page, user);
    await expectPublicNotFound(page, `/admin/materials/${randomUUID()}`);
    await expectNoAdminTrace(page);
  } finally {
    await deleteAuthUsersByEmail(user.email);
  }
});
