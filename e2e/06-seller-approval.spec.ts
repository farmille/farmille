import { expect, test, type Page } from "@playwright/test";
import { captureScreenFlow } from "./support/screen-flow";

import { E2E_ADMIN_ACCOUNTS } from "./support/admin-accounts";
import {
  cleanupSellerByLoginId,
  createMaterial,
  deleteMaterial,
  getMaterial,
  sellerApprovalByLoginId,
  sellerLoginIdByOfficialName,
  uniqueToken,
} from "./support/test-data";
import { loginAdminAndEnrollMfa } from "./support/ui";

async function captureAccountScreen(page: Page, filename: string): Promise<void> {
  if (process.env.CAPTURE_ACCOUNT_FLOW !== "1") return;
  await expect(page.getByText("読み込んでいます", { exact: true })).toHaveCount(0);

  await captureScreenFlow(page, filename);
}

for (const mode of ["existing", "new"]) {
  test(`@smoke メーカー申請、メーカー紐づけ（${mode}）、共有ログイン、ダッシュボード`, async ({
    page,
  }) => {
    let loginId = uniqueToken("seller").slice(0, 30);
    const officialName = `E2Eメーカー${loginId.slice(-6)}株式会社`;
    let material = await createMaterial("approval-link");
    const newManufacturerName = `E2E新規メーカー_${loginId}`;

    try {
      await page.goto("/sellers");
      await expect(
        page.getByRole("heading", { name: "Farmille 企業様向け利用ガイド" }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "登録済みの方：ログイン", exact: true }),
      ).toHaveAttribute("href", "/sellers/login");
      await expect(
        page.getByRole("link", { name: "アカウントをお持ちの方はログイン" }),
      ).toBeVisible();
      await captureAccountScreen(page, "33-manufacturer-landing.png");
      await page.getByRole("link", { name: "申請フォームへ進む" }).click();
      await expect(page).toHaveURL(/\/sellers\/apply$/);
      await expect(page.getByRole("link", { name: "戻る" })).toHaveAttribute("href", "/sellers");
      await captureAccountScreen(page, "03-seller-apply.png");
      await page.getByLabel("法人名", { exact: false }).fill(officialName);
      await expect(page.getByLabel("種別")).toHaveCount(0);
      await expect(page.getByText(/JA|農業法人|専門家/)).toHaveCount(0);
      await expect(page.getByLabel("ご希望のログインID")).toHaveCount(0);
      await page.getByLabel("法人番号").fill("1234567890123");
      await page.getByLabel("ご担当者電話番号").fill("090-1234-5678");
      await page.getByLabel("連絡先メールアドレス").fill(`${loginId}@example.test`);
      await page.getByLabel("ご担当者名").fill("E2E 申請担当");
      await page.getByLabel("本社・主な拠点の所在地").fill("東京都千代田区");
      await expect(page.getByLabel("主な地域")).toHaveCount(0);
      await page.getByRole("button", { name: "申請する" }).click();
      await expect(page.getByRole("heading", { name: "申請を受け付けました" })).toBeVisible();
      await captureAccountScreen(page, "04-seller-apply-done.png");
      loginId = await sellerLoginIdByOfficialName(officialName);

      await page.setViewportSize({ width: 1280, height: 900 });
      await loginAdminAndEnrollMfa(
        page,
        mode === "new" ? E2E_ADMIN_ACCOUNTS.sellerNewApproval : E2E_ADMIN_ACCOUNTS.sellerApproval,
        "/admin/sellers?status=applied",
      );
      await captureAccountScreen(page, "11-admin-sellers-list.png");
      await page.getByRole("link", { name: officialName }).click();
      await expect(
        page.getByRole("button", { name: "確認を完了してログインを発行" }),
      ).toBeDisabled();
      if (mode === "new") {
        await page.getByLabel("紐づける資材メーカー").selectOption("__new__");
        await page.getByLabel("新規メーカー名").fill(newManufacturerName);
      } else {
        await page.getByLabel("紐づける資材メーカー").selectOption(material.manufacturer_name);
      }
      await captureAccountScreen(
        page,
        mode === "new" ? "61-admin-new-manufacturer.png" : "12-admin-seller-detail.png",
      );
      await page.setViewportSize({ width: 375, height: 812 });
      await captureAccountScreen(
        page,
        mode === "new" ? "63-admin-new-mobile.png" : "62-admin-link-mobile.png",
      );
      await page.getByRole("button", { name: "確認を完了してログインを発行" }).click();
      await expect
        .poll(
          async () => {
            const approval = await sellerApprovalByLoginId(loginId);
            return approval?.status === "approved" && approval.auth_user_id !== null;
          },
          { timeout: 30_000 },
        )
        .toBe(true);
      await expect(
        page.getByText("ログインIDとパスワード設定用の案内を発行しました。"),
      ).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByText("状態：確認済み", { exact: true })).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByText(/^発行済み（.+）$/)).toBeVisible({ timeout: 30_000 });

      const loginIdBlock = page.getByText("ログインID", { exact: true }).locator("..");
      const passwordBlock = page.getByText("パスワード設定用URL", { exact: true }).locator("..");
      const issuedLoginId = (await loginIdBlock.locator("span").nth(1).textContent())?.trim();
      const setupUrl = (await passwordBlock.locator("span").nth(1).textContent())?.trim();
      const issuedPassword = "Farmille-E2E-Setup-2026!";

      if (issuedLoginId === undefined || setupUrl === undefined) {
        throw new Error("承認後の共有ログイン情報を取得できませんでした。");
      }

      expect(issuedLoginId).toBe(loginId);
      if (mode === "new") {
        await deleteMaterial(material.id);
        material = await createMaterial("approval-future", null, newManufacturerName);
      }
      await page.context().clearCookies();
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(setupUrl);
      await page.locator('input[name="password"]').fill(issuedPassword);
      await page.locator('input[name="passwordConfirmation"]').fill(issuedPassword);
      await page.getByRole("button", { name: "パスワードを変更する" }).click();
      await expect(page.getByText("パスワードを変更しました。", { exact: true })).toBeVisible();
      await page.goto("/sellers/login");
      await captureAccountScreen(page, "05-seller-login.png");
      await page.getByLabel("ログインID").fill(issuedLoginId);
      await page.getByLabel("パスワード").fill(issuedPassword);
      await page.getByRole("button", { name: "ログインする" }).click();

      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByRole("heading", { name: officialName })).toBeVisible();
      await expect(page.getByText("確認済み", { exact: true })).toBeVisible();
      // アカウント確認や会社名の一致だけでは資材の編集権を渡さない。
      expect((await getMaterial(material.id)).seller_id).toBeNull();
      await page.goto(`/dashboard/materials/${material.id}`);
      await expect(page.getByText("編集権の書類確認が必要です", { exact: true })).toBeVisible();
      await page.goto("/dashboard");
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
      await deleteMaterial(material.id);
      await cleanupSellerByLoginId(loginId);
    }
  });
}
