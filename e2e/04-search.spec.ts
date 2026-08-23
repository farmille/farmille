import { expect, test } from "@playwright/test";

import {
  createGeneralUser,
  createReview,
  cropsByNames,
  deleteAuthUsersByEmail,
  listSeedMaterials,
  productTypesByNames,
} from "./support/test-data";

test("@smoke タグ AND／OR、並び替え、検索結果から詳細への遷移", async ({ page }) => {
  const materials = await listSeedMaterials();
  const reviewHeavy = materials[0];
  const ratingHigh = materials[1];

  if (reviewHeavy === undefined || ratingHigh === undefined) {
    throw new Error("検索テスト用のシード資材が不足しています。");
  }

  const authors = await Promise.all([
    createGeneralUser("sorta"),
    createGeneralUser("sortb"),
    createGeneralUser("sortc"),
  ]);

  try {
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

    const [crops, productTypes] = await Promise.all([
      cropsByNames(["いちご", "水稲"]),
      productTypesByNames(["バイオスティミュラント"]),
    ]);
    const cropsByName = new Map(crops.map((crop) => [crop.name, crop]));
    const productTypesByName = new Map(productTypes.map((type) => [type.name, type]));
    const strawberry = cropsByName.get("いちご");
    const rice = cropsByName.get("水稲");
    const biostimulant = productTypesByName.get("バイオスティミュラント");

    if (strawberry === undefined || rice === undefined || biostimulant === undefined) {
      throw new Error("検索テスト用の分類マスタが見つかりません。");
    }

    await page.goto(`/search?filters=crop:${strawberry.id},crop:${rice.id}`);
    await expect(page.getByText("いちご または 水稲", { exact: true })).toBeVisible();
    await expect(page.getByText("Actibio X EVO53", { exact: true })).toBeVisible();
    await expect(page.getByText("ハイタック-C", { exact: true })).toBeVisible();

    await page.goto(`/search?filters=crop:${strawberry.id},type:${biostimulant.id}`);
    await expect(
      page.getByText("いちご かつ バイオスティミュラント", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Actibio X EVO53", { exact: true })).toBeVisible();
    await expect(page.getByText("ハイタック-C", { exact: true })).toHaveCount(0);

    await page.goto("/search?sort=reviews");
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
  }
});
