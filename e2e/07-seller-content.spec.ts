import { expect, test } from "@playwright/test";
import { E2E_ADMIN_ACCOUNTS } from "./support/admin-accounts";
import {
  cleanupSellerByLoginId,
  createApprovedSeller,
  createGeneralUser,
  createMaterial,
  createReview,
  deleteAuthUsersByEmail,
  deleteMaterial,
  getMaterial,
  uniqueToken,
} from "./support/test-data";
import { loginAdminAndEnrollMfa, loginSeller } from "./support/ui";

test("書類確認で資材単位の編集権を付与し、原稿を表現確認後に公開する", async ({
  browser,
  page,
}) => {
  const seller = await createApprovedSeller("editor");
  const reviewer = await createGeneralUser("archive-reviewer");
  const material = await createMaterial("editor", null, seller.officialName);
  const otherMaterial = await createMaterial("no-right", null, seller.officialName);
  const description = `製品説明_${uniqueToken("description")}`;
  const adminContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const adminPage = await adminContext.newPage();
  try {
    await loginSeller(page, seller);
    await page.goto(`/dashboard/materials/${material.id}`);
    await expect(page.getByText("編集権の書類確認が必要です", { exact: true })).toBeVisible();
    await loginAdminAndEnrollMfa(
      adminPage,
      E2E_ADMIN_ACCOUNTS.materialGovernance,
      `/admin/materials/${material.id}`,
    );
    await adminPage.getByLabel("編集権を付与するメーカー").selectOption(seller.id);
    await adminPage.getByLabel("確認した返送書類").fill(`E2E-DOCUMENT-${material.id}`);
    await adminPage.getByRole("button", { name: "編集権を更新する" }).click();
    await expect(
      adminPage.getByText("書類確認の記録を保存し、この資材の編集権を付与しました。"),
    ).toBeVisible();
    expect((await getMaterial(material.id)).seller_id).toBe(seller.id);
    expect((await getMaterial(otherMaterial.id)).seller_id).toBeNull();
    await page.goto(`/dashboard/materials/${otherMaterial.id}`);
    await expect(page.getByText("編集権の書類確認が必要です", { exact: true })).toBeVisible();
    await page.goto(`/dashboard/materials/${material.id}`);
    await page.getByRole("textbox", { name: "製品説明", exact: true }).fill(description);
    await page.getByLabel("主な成分", { exact: true }).fill("海藻抽出物");
    await page.getByRole("checkbox", { name: "播種・定植時", exact: true }).check();
    await page.getByRole("button", { name: "下書きを保存", exact: true }).click();
    await expect(page.getByText("下書きを保存しました。", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("textbox", { name: "製品説明", exact: true })).toHaveValue(
      description,
    );
    await page.getByRole("button", { name: "プレビュー", exact: true }).click();
    await expect(page.getByText(description, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "編集に戻る", exact: true }).click();
    await page.getByRole("button", { name: "保存して表現確認へ送る", exact: true }).click();
    await expect(
      page.getByText("表現確認中です。公開内容は確認完了後に変わります。"),
    ).toBeVisible();
    await page.goto(`/materials/${material.id}`);
    await expect(page.getByText(description, { exact: true })).toHaveCount(0);
    await adminPage.goto("/admin/materials/expressions");
    const card = adminPage
      .locator("section, article, div")
      .filter({ has: adminPage.getByRole("heading", { name: material.name, exact: true }) })
      .filter({ has: adminPage.getByRole("link", { name: "原稿を確認", exact: true }) })
      .last();
    await card.getByRole("link", { name: "原稿を確認", exact: true }).click();
    await expect(adminPage.getByText(description, { exact: true }).first()).toBeVisible();
    await adminPage.getByRole("button", { name: "表現確認を完了して反映", exact: true }).click();
    await expect(adminPage.getByText("表現確認を完了し、製品情報を反映しました。")).toBeVisible();
    await page.goto(`/materials/${material.id}`);
    await expect(page.getByText(description, { exact: true })).toBeVisible();
    await expect(page.getByText("メーカー確認済み", { exact: true })).toHaveCount(0);
    await createReview({
      materialId: material.id,
      authorUserId: reviewer.id,
      rating: 4,
      body: "非公開後も保持する感想口コミ",
    });
    await page.goto(`/dashboard/materials/${material.id}`);
    await expect(page.getByRole("link", { name: /公開済み/ })).toBeVisible();
    await page.getByLabel("非公開にする理由").fill("販売終了のため");
    await page.getByRole("button", { name: "理由を記録して非公開にする" }).click();
    await expect(page.getByText("非公開", { exact: true })).toBeVisible();
    const anonymous = await browser.newPage();
    try {
      await anonymous.goto(`/materials/${material.id}`);
      await expect(
        anonymous.getByRole("main").getByText("資材が見つかりません", { exact: true }),
      ).toBeVisible();
      await anonymous.goto("/");
      await expect(
        anonymous.getByText("非公開後も保持する感想口コミ", { exact: true }),
      ).toHaveCount(0);
    } finally {
      await anonymous.close();
    }
  } finally {
    await adminContext.close();
    await deleteMaterial(otherMaterial.id);
    await deleteMaterial(material.id);
    await cleanupSellerByLoginId(seller.loginId);
    await deleteAuthUsersByEmail(reviewer.email);
  }
});
