import { expect, test } from "@playwright/test";

import { E2E_ADMIN_ACCOUNTS } from "./support/admin-accounts";
import { cleanupSellerByLoginId, uniqueToken } from "./support/test-data";
import { loginAdminAndEnrollMfa } from "./support/ui";

test("@smoke 出品者申請、admin 承認と MFA、共有ログイン、ダッシュボード", async ({ page }) => {
  const loginId = uniqueToken("seller").slice(0, 30);
  const officialName = `E2E申請_${loginId}株式会社`;

  try {
    await page.goto("/sellers/apply");
    await page.getByLabel("正式名称（法人名・組織名）").fill(officialName);
    await page.getByLabel("種別").selectOption("maker");
    await page.getByLabel("ご希望のログインID").fill(loginId);
    await page.getByLabel("連絡先メールアドレス").fill(`${loginId}@example.test`);
    await page.getByLabel("ご担当者名").fill("E2E 申請担当");
    await page.getByLabel("本社・主な拠点の所在地").fill("東京都千代田区");
    await page.getByLabel("主な地域").selectOption("全国");
    await page.getByRole("button", { name: "申請する" }).click();
    await expect(page.getByRole("heading", { name: "申請を受け付けました" })).toBeVisible();

    await loginAdminAndEnrollMfa(
      page,
      E2E_ADMIN_ACCOUNTS.sellerApproval,
      "/admin/sellers?status=applied",
    );
    await page.getByRole("link", { name: officialName }).click();
    await page.getByRole("button", { name: "承認して共有ログインを発行" }).click();
    await expect(page.getByText("共有ログインを発行しました。")).toBeVisible();

    const loginIdBlock = page.getByText("ログインID", { exact: true }).locator("..");
    const passwordBlock = page.getByText("初期パスワード", { exact: true }).locator("..");
    const issuedLoginId = (await loginIdBlock.locator("span").nth(1).textContent())?.trim();
    const issuedPassword = (await passwordBlock.locator("span").nth(1).textContent())?.trim();

    if (issuedLoginId === undefined || issuedPassword === undefined) {
      throw new Error("承認後の共有ログイン情報を取得できませんでした。");
    }

    expect(issuedLoginId).toBe(loginId);
    await page.context().clearCookies();
    await page.goto("/sellers/login");
    await page.getByLabel("ログインID").fill(issuedLoginId);
    await page.getByLabel("パスワード").fill(issuedPassword);
    await page.getByRole("button", { name: "ログインする" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: officialName })).toBeVisible();
    await expect(page.getByText("承認済み", { exact: true })).toBeVisible();
  } finally {
    await cleanupSellerByLoginId(loginId);
  }
});
