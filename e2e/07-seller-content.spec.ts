import { expect, test } from "@playwright/test";

import {
  cleanupSellerByLoginId,
  createApprovedSeller,
  createMaterial,
  deleteMaterial,
  uniqueToken,
} from "./support/test-data";
import { loginSeller } from "./support/ui";

test("出品者の一次情報編集、公開反映、記事作成、公開、関連記事表示", async ({ page }) => {
  const seller = await createApprovedSeller("content");
  const material = await createMaterial("sellercontent", seller.id);
  const description = `E2E一次情報_${uniqueToken("description")}`;
  const generalUse = `E2E一般用途_${uniqueToken("generaluse")}`;
  const articleTitle = `E2E記事_${uniqueToken("article")}`;

  try {
    await loginSeller(page, seller);
    await page.getByRole("link", { name: new RegExp(material.name) }).click();
    await page.getByLabel("紹介文").fill(description);
    await page.getByLabel("一般用途").fill(generalUse);
    await page.getByLabel("使い方").fill("E2Eでは1000倍に希釈して使用します。");
    await page.getByRole("button", { name: "一次情報を保存" }).click();
    await expect(page.getByText("一次情報を保存しました。")).toBeVisible();

    await page.goto(`/materials/${material.id}`);
    await expect(page.getByText(generalUse, { exact: true })).toBeVisible();

    await page.goto("/dashboard/articles/new");
    await page.getByLabel("タイトル").fill(articleTitle);
    await page
      .getByLabel("本文（Markdown）")
      .fill("## E2E本文\n\n公開反映を確認する記事本文です。");
    const materialSearch = page.getByLabel("資材を検索して追加");
    const publishButton = page.getByRole("button", { name: "公開する" });
    const [materialSearchBox, publishButtonBox] = await Promise.all([
      materialSearch.boundingBox(),
      publishButton.boundingBox(),
    ]);
    if (materialSearchBox === null || publishButtonBox === null) {
      throw new Error("記事フォームの資材検索または公開ボタンが表示されていません。");
    }
    expect(materialSearchBox.y).toBeLessThan(publishButtonBox.y);

    await materialSearch.fill("sellercontent");
    await page.getByRole("button", { name: "検索", exact: true }).click();
    await page.getByRole("button", { name: new RegExp(material.name) }).click();
    await publishButton.click();

    await expect(page).toHaveURL(/\/articles\/[0-9a-f-]+$/);
    await expect(page.getByRole("heading", { name: articleTitle })).toBeVisible();
    await expect(page.getByText("公開反映を確認する記事本文です。")).toBeVisible();
    await expect(page.getByText(material.name, { exact: true })).toBeVisible();

    await page.goto(`/materials/${material.id}/articles`);
    await expect(page.getByText(articleTitle, { exact: true })).toBeVisible();
  } finally {
    await deleteMaterial(material.id);
    await cleanupSellerByLoginId(seller.loginId);
  }
});
