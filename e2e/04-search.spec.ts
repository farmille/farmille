import { expect, test } from "@playwright/test";

import { E2E_ADMIN_ACCOUNTS } from "./support/admin-accounts";
import {
  addMaterialClassifications,
  archiveMaterial,
  createMaterial,
  cropsByNames,
  deleteMaterial,
} from "./support/test-data";
import { chooseOption, loginAdminAndEnrollMfa } from "./support/ui";

test("@smoke 公開状態、作目検索、並び替え操作と詳細への遷移", async ({ page, browser }) => {
  const crops = await cropsByNames(["いちご", "水稲"]);
  const strawberry = crops.find((crop) => crop.name === "いちご");
  const rice = crops.find((crop) => crop.name === "水稲");
  if (strawberry === undefined || rice === undefined)
    throw new Error("検索テスト用の作目が見つかりません。");

  const [otherMaterial, matchingMaterial] = await Promise.all([
    createMaterial("search-other"),
    createMaterial("search-match"),
  ]);

  try {
    await Promise.all([
      addMaterialClassifications(otherMaterial.id, { cropIds: [rice.id] }),
      addMaterialClassifications(matchingMaterial.id, {
        cropIds: [strawberry.id],
      }),
    ]);
    await archiveMaterial(matchingMaterial.id);
    const adminContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    try {
      const adminPage = await adminContext.newPage();
      await loginAdminAndEnrollMfa(
        adminPage,
        E2E_ADMIN_ACCOUNTS.searchCatalog,
        `/admin/materials/${matchingMaterial.id}`,
      );
      await adminPage.getByRole("radio", { name: "公開中", exact: true }).check();
      await adminPage.getByRole("button", { name: "公開状態を更新", exact: true }).click();
      await expect(
        adminPage.getByText("資材を公開状態へ戻しました。", { exact: true }),
      ).toBeVisible();
    } finally {
      await adminContext.close();
    }

    await page.goto(`/search?filters=crop:${strawberry.id}`);
    await expect(page.getByText(matchingMaterial.name, { exact: true })).toBeVisible();
    await expect(page.getByText(otherMaterial.name, { exact: true })).toHaveCount(0);
    const resultLink = page.locator(`main a[href="/materials/${matchingMaterial.id}"]`);
    await chooseOption(page, page.getByLabel("並び替え"), "評価が高い順");
    await expect(page).toHaveURL(/sort=rating/);
    await expect(resultLink).toContainText(matchingMaterial.name);
    await resultLink.click();
    await expect(page).toHaveURL(`/materials/${matchingMaterial.id}`);
  } finally {
    await deleteMaterial(otherMaterial.id);
    await deleteMaterial(matchingMaterial.id);
  }
});
