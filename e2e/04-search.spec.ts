import { expect, test } from "@playwright/test";

import { E2E_ADMIN_ACCOUNTS } from "./support/admin-accounts";
import {
  addMaterialClassifications,
  archiveMaterial,
  createGeneralUser,
  createMaterial,
  createReview,
  cropsByNames,
  deleteAuthUsersByEmail,
  deleteMaterial,
  genresByNames,
} from "./support/test-data";
import { loginAdminAndEnrollMfa } from "./support/ui";

test("@smoke タグ AND／OR、並び替え、検索結果から詳細への遷移", async ({ page, browser }) => {
  const [crops, genres] = await Promise.all([
    cropsByNames(["いちご", "水稲"]),
    genresByNames(["海藻、海藻抽出物"]),
  ]);
  const cropsByName = new Map(crops.map((crop) => [crop.name, crop]));
  const genresByName = new Map(genres.map((genre) => [genre.name, genre]));
  const strawberry = cropsByName.get("いちご");
  const rice = cropsByName.get("水稲");
  const seaweed = genresByName.get("海藻、海藻抽出物");

  if (strawberry === undefined || rice === undefined || seaweed === undefined) {
    throw new Error("検索テスト用の分類マスタが見つかりません。");
  }

  const [reviewHeavy, ratingHigh] = await Promise.all([
    createMaterial("search-reviews"),
    createMaterial("search-rating"),
  ]);
  const authors = await Promise.all([
    createGeneralUser("sorta"),
    createGeneralUser("sortb"),
    createGeneralUser("sortc"),
  ]);

  try {
    await Promise.all([
      addMaterialClassifications(reviewHeavy.id, { cropIds: [rice.id] }),
      addMaterialClassifications(ratingHigh.id, {
        cropIds: [strawberry.id],
        genreIds: [seaweed.id],
      }),
    ]);
    await createReview({
      materialId: reviewHeavy.id,
      authorUserId: authors[0].id,
      rating: 3,
      body: `E2E並び替えA_${authors[0].id}`,
    });
    await createReview({
      materialId: reviewHeavy.id,
      authorUserId: authors[1].id,
      rating: 3,
      body: `E2E並び替えB_${authors[1].id}`,
    });
    await createReview({
      materialId: ratingHigh.id,
      authorUserId: authors[2].id,
      rating: 5,
      body: `E2E並び替えC_${authors[2].id}`,
    });

    await archiveMaterial(ratingHigh.id);
    const adminContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    try {
      const adminPage = await adminContext.newPage();
      await loginAdminAndEnrollMfa(
        adminPage,
        E2E_ADMIN_ACCOUNTS.searchCatalog,
        `/admin/materials/${ratingHigh.id}`,
      );
      await adminPage.getByRole("radio", { name: "公開中", exact: true }).check();
      await adminPage.getByRole("button", { name: "公開状態を更新", exact: true }).click();
      await expect(
        adminPage.getByText("資材を公開状態へ戻しました。", { exact: true }),
      ).toBeVisible();
    } finally {
      await adminContext.close();
    }

    await page.goto(`/search?filters=crop:${strawberry.id},crop:${rice.id}`);
    await expect(page.getByText("いちご または 水稲", { exact: true })).toBeVisible();
    await expect(page.getByText(reviewHeavy.name, { exact: true })).toBeVisible();
    await expect(page.getByText(ratingHigh.name, { exact: true })).toBeVisible();

    await page.goto(`/search?filters=crop:${strawberry.id},genre:${seaweed.id}`);
    await expect(page.getByText("いちご かつ 海藻、海藻抽出物", { exact: true })).toBeVisible();
    await expect(page.getByText(ratingHigh.name, { exact: true })).toBeVisible();
    await expect(page.getByText(reviewHeavy.name, { exact: true })).toHaveCount(0);

    await page.goto(
      `/search?sort=reviews&filters=${encodeURIComponent(`name:${reviewHeavy.name},name:${ratingHigh.name}`)}`,
    );
    const resultLinks = page.locator('main a[href^="/materials/"]');
    await expect(resultLinks.first()).toContainText(reviewHeavy.name);

    await page.getByLabel("並び替え").selectOption("rating");
    await expect(page).toHaveURL(/sort=rating/);
    await expect(resultLinks.first()).toContainText(ratingHigh.name);
    await resultLinks.first().click();
    await expect(page).toHaveURL(`/materials/${ratingHigh.id}`);
  } finally {
    for (const author of authors) {
      await deleteAuthUsersByEmail(author.email);
    }
    await deleteMaterial(reviewHeavy.id);
    await deleteMaterial(ratingHigh.id);
  }
});
