import { expect } from "e2e";
import {
  addMaterialClassifications,
  createReview,
  cropsByNames,
  genresByNames,
} from "../../e2e/support/test-data";
import { materialTest } from "../support/fixtures";

materialTest(
  "作物内のORと分類間のANDを保ち評価順に資材を表示する",
  async ({ app, screen, browser, member, material, secondMaterial }) => {
    const crops = await cropsByNames(["いちご", "水稲"]);
    const strawberry = crops.find((crop) => crop.name === "いちご");
    const rice = crops.find((crop) => crop.name === "水稲");
    const seaweed = (await genresByNames(["海藻、海藻抽出物"]))[0];
    if (strawberry === undefined || rice === undefined || seaweed === undefined) {
      throw new Error("検索テストの分類マスタがありません。");
    }
    await addMaterialClassifications(material.id, { cropIds: [rice.id] });
    await addMaterialClassifications(secondMaterial.id, {
      cropIds: [strawberry.id],
      genreIds: [seaweed.id],
    });
    await createReview({
      materialId: material.id,
      authorUserId: member.id,
      rating: 3,
      body: "水稲で観察しました。",
    });
    await createReview({
      materialId: secondMaterial.id,
      authorUserId: member.id,
      rating: 5,
      body: "いちごで観察しました。",
    });
    await app.open(`/search?filters=crop:${strawberry.id},crop:${rice.id}`);
    await expect(screen.getByText("いちご または 水稲")).toBeVisible();
    await expect(screen.getByText(material.name)).toBeVisible();
    await expect(screen.getByText(secondMaterial.name)).toBeVisible();
    await app.open(`/search?filters=crop:${strawberry.id},genre:${seaweed.id}`);
    await expect(screen.getByText("いちご かつ 海藻、海藻抽出物")).toBeVisible();
    await expect(screen.getByText(secondMaterial.name)).toBeVisible();
    await expect(screen.getByText(material.name)).toHaveCount(0);
    await app.open(
      `/search?filters=${encodeURIComponent(`name:${material.name},name:${secondMaterial.name}`)}`,
    );
    await screen.getByLabel("並び替え").selectOption({ value: "rating" });
    await expect(browser).toHaveURL(/sort=rating/);
    await expect(browser.locator('main a[href^="/materials/"]').first()).toContainText(
      secondMaterial.name,
    );
    await browser.locator('main a[href^="/materials/"]').first().tap();
    await expect(browser).toHaveURL(`/materials/${secondMaterial.id}`);
  },
);

materialTest("一致する資材がない検索結果を表示する", async ({ app, screen, browser, member }) => {
  await app.open(`/search?filters=${encodeURIComponent(`name:存在しない資材_${member.id}`)}`);
  await expect(screen.getByRole("heading", "条件に合う資材が見つかりませんでした")).toBeVisible();
  await expect(browser.locator('main a[href^="/materials/"]')).toHaveCount(0);
  await expect(screen.getByText("ページを表示できませんでした")).toHaveCount(0);
});
