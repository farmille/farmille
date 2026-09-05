import { expect, test, type Page } from "@playwright/test";

import { E2E_ADMIN_ACCOUNTS } from "./support/admin-accounts";
import { cleanupSellerByLoginId, sellerApprovalByLoginId, uniqueToken } from "./support/test-data";
import { loginAdminAndEnrollMfa } from "./support/ui";

async function captureAccountScreen(page: Page, filename: string): Promise<void> {
  if (process.env.CAPTURE_ACCOUNT_FLOW !== "1") return;

  await page.screenshot({
    path: `docs/rebuild/assets/account-flow/screens/${filename}`,
    fullPage: true,
  });
}

test("@smoke メーカー申請、admin 承認と MFA、共有ログイン、ダッシュボード", async ({ page }) => {
  const loginId = uniqueToken("seller").slice(0, 30);
  const officialName = `E2Eメーカー${loginId.slice(-6)}株式会社`;

  try {
    await page.goto("/sellers");
    await expect(
      page.getByRole("heading", { name: "自社資材の情報を、正確に届ける。" }),
    ).toBeVisible();
    await expect(page.getByText("利用できるのは、農業資材を製造するメーカーです。")).toBeVisible();
    await expect(page.getByRole("link", { name: "ログイン", exact: true })).toHaveAttribute(
      "href",
      "/sellers/login",
    );
    await expect(
      page.getByRole("link", { name: "アカウントをお持ちの方はログイン" }),
    ).toBeVisible();
    await captureAccountScreen(page, "33-manufacturer-landing.png");
    await page.getByRole("link", { name: "メーカーアカウントを申請" }).click();
    await expect(page).toHaveURL(/\/sellers\/apply$/);
    await expect(page.getByRole("link", { name: "戻る" })).toHaveAttribute("href", "/sellers");
    await captureAccountScreen(page, "03-seller-apply.png");
    await page.getByLabel("メーカー名（法人名）").fill(officialName);
    await expect(page.getByLabel("種別")).toHaveCount(0);
    await expect(page.getByText(/JA|農業法人|専門家/)).toHaveCount(0);
    await page.getByLabel("ご希望のログインID").fill(loginId);
    await page.getByLabel("連絡先メールアドレス").fill(`${loginId}@example.test`);
    await page.getByLabel("ご担当者名").fill("E2E 申請担当");
    await page.getByLabel("本社・主な拠点の所在地").fill("東京都千代田区");
    await page.getByLabel("主な地域").selectOption("全国");
    await page.getByRole("button", { name: "申請する" }).click();
    await expect(page.getByRole("heading", { name: "申請を受け付けました" })).toBeVisible();
    await captureAccountScreen(page, "04-seller-apply-done.png");

    await page.setViewportSize({ width: 1280, height: 900 });
    await loginAdminAndEnrollMfa(
      page,
      E2E_ADMIN_ACCOUNTS.sellerApproval,
      "/admin/sellers?status=applied",
    );
    await captureAccountScreen(page, "11-admin-sellers-list.png");
    await page.getByRole("link", { name: officialName }).click();
    await captureAccountScreen(page, "12-admin-seller-detail.png");
    await page.getByRole("button", { name: "承認して共有ログインを発行" }).click();
    await expect
      .poll(
        async () => {
          const approval = await sellerApprovalByLoginId(loginId);
          return approval?.status === "approved" && approval.auth_user_id !== null;
        },
        { timeout: 30_000 },
      )
      .toBe(true);
    await expect(page.getByText("共有ログインを発行しました。")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("状態：承認済み", { exact: true })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/^発行済み（.+）$/)).toBeVisible({ timeout: 30_000 });

    const loginIdBlock = page.getByText("ログインID", { exact: true }).locator("..");
    const passwordBlock = page.getByText("初期パスワード", { exact: true }).locator("..");
    const issuedLoginId = (await loginIdBlock.locator("span").nth(1).textContent())?.trim();
    const issuedPassword = (await passwordBlock.locator("span").nth(1).textContent())?.trim();

    if (issuedLoginId === undefined || issuedPassword === undefined) {
      throw new Error("承認後の共有ログイン情報を取得できませんでした。");
    }

    expect(issuedLoginId).toBe(loginId);
    await page.context().clearCookies();
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/sellers/login");
    await captureAccountScreen(page, "05-seller-login.png");
    await page.getByLabel("ログインID").fill(issuedLoginId);
    await page.getByLabel("パスワード").fill(issuedPassword);
    await page.getByRole("button", { name: "ログインする" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: officialName })).toBeVisible();
    await expect(page.getByText("承認済み", { exact: true })).toBeVisible();
    await captureAccountScreen(page, "10-dashboard.png");

    await page.goto("/post");
    await expect(page).toHaveURL(/\/post$/);
    await expect(page.getByRole("heading", { name: "一般ユーザー向けの画面です" })).toBeVisible();
    await expect(page.getByRole("link", { name: "メーカーダッシュボードへ" })).toHaveAttribute(
      "href",
      "/dashboard",
    );

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
  } finally {
    await cleanupSellerByLoginId(loginId);
  }
});
