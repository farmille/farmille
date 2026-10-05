import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import { E2E_ADMIN_ACCOUNTS } from "./support/admin-accounts";
import {
  cleanupSellerByLoginId,
  createApprovedSeller,
  createGeneralUser,
  deleteAuthUsersByEmail,
} from "./support/test-data";
import {
  loginAdminAndEnrollMfa,
  loginAdminWithPassword,
  loginGeneral,
  loginSeller,
} from "./support/ui";

const MISSING_ADMIN_DETAIL_PATHS = [
  `/admin/materials/${randomUUID()}`,
  `/admin/sellers/${randomUUID()}`,
  `/admin/usage-reports/${randomUUID()}`,
];

const ADMIN_PATHS_FOR_NON_ADMINS = [...MISSING_ADMIN_DETAIL_PATHS, "/admin/sellers"];

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

function isRedirectTo(pathname: string, next: string): (url: URL) => boolean {
  return (url) => url.pathname === pathname && url.searchParams.get("next") === next;
}

test("未ログインで運営の詳細 URL を開くとログインへ誘導される", async ({ page }) => {
  for (const path of MISSING_ADMIN_DETAIL_PATHS) {
    await page.goto(path);
    await expect(page).toHaveURL(isRedirectTo("/login", path));
    await expectNoAdminTrace(page);
  }
});

test("一般ユーザーには運営画面の痕跡が無い 404 を返す", async ({ page }) => {
  const user = await createGeneralUser("admin-not-found");

  try {
    await loginGeneral(page, user);
    for (const path of ADMIN_PATHS_FOR_NON_ADMINS) {
      await expectPublicNotFound(page, path);
      await expectNoAdminTrace(page);
    }
  } finally {
    await deleteAuthUsersByEmail(user.email);
  }
});

test("メーカーには運営画面の痕跡が無い 404 を返す", async ({ page }) => {
  const seller = await createApprovedSeller("admin-not-found");

  try {
    await loginSeller(page, seller);
    for (const path of ADMIN_PATHS_FOR_NON_ADMINS) {
      await expectPublicNotFound(page, path);
      await expectNoAdminTrace(page);
    }
  } finally {
    await cleanupSellerByLoginId(seller.loginId);
  }
});

test("2要素認証前の運営は詳細 URL から2要素認証へ誘導される", async ({ page }) => {
  const [first, ...rest] = MISSING_ADMIN_DETAIL_PATHS;

  await loginAdminWithPassword(page, E2E_ADMIN_ACCOUNTS.notFoundVisibility, first);
  await expect(page).toHaveURL(isRedirectTo("/admin/mfa", first));
  await expect(page).toHaveTitle(/^2要素認証/);
  for (const path of rest) {
    await page.goto(path);
    await expect(page).toHaveURL(isRedirectTo("/admin/mfa", path));
  }
});

test("2要素認証済みの運営にも存在しない詳細は 404 を返す", async ({ page }) => {
  const [first] = MISSING_ADMIN_DETAIL_PATHS;

  await loginAdminAndEnrollMfa(page, E2E_ADMIN_ACCOUNTS.notFoundVisibility, first);
  for (const path of MISSING_ADMIN_DETAIL_PATHS) {
    await expectPublicNotFound(page, path);
  }
});
