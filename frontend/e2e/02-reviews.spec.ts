import { expect, test } from "@playwright/test";

import {
  createGeneralUser,
  deleteAuthUsersByEmail,
  getMaterial,
  listSeedMaterials,
  reviewByAuthor,
} from "./support/test-data";
import { loginGeneral } from "./support/ui";

test("@smoke レビュー投稿、集計反映、編集、削除", async ({ page }) => {
  const user = await createGeneralUser("review");
  const material = (await listSeedMaterials())[0];

  if (material === undefined) {
    throw new Error("レビュー対象のシード資材が見つかりません。");
  }

  const body = `E2Eレビュー_${user.id}`;
  const updatedBody = `${body}_更新済み`;

  try {
    await loginGeneral(page, user);
    await page.goto(`/materials/${material.id}/review/new`);
    await page.getByLabel("作目").selectOption({ label: "トマト" });
    await page.getByRole("radio", { name: "4", exact: true }).check();
    await page.getByLabel("レビュー本文").fill(body);
    await page.getByRole("checkbox", { name: /このレビューには、病害虫の防除/ }).check();
    await page.getByRole("button", { name: "投稿する" }).click();

    await expect(page).toHaveURL(new RegExp(`/materials/${material.id}\\?review=posted`));
    await expect(page.getByText(body, { exact: true })).toBeVisible();
    await expect
      .poll(async () => (await getMaterial(material.id)).review_count)
      .toBe(material.review_count + 1);
    await expect.poll(async () => (await getMaterial(material.id)).avg_rating).toBe(4);

    const reviewCard = page.getByRole("article").filter({ hasText: body });
    await reviewCard.getByRole("link", { name: "編集" }).click();
    await page.getByRole("radio", { name: "5", exact: true }).check();
    await page.getByLabel("レビュー本文").fill(updatedBody);
    await page.getByRole("button", { name: "変更を保存する" }).click();

    await expect(page.getByText(updatedBody, { exact: true })).toBeVisible();
    await expect.poll(async () => (await reviewByAuthor(user.id))?.rating).toBe(5);
    await expect.poll(async () => (await getMaterial(material.id)).avg_rating).toBe(5);

    const updatedCard = page.getByRole("article").filter({ hasText: updatedBody });
    await updatedCard.getByRole("button", { name: "削除" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "削除する" }).click();

    await expect(page.getByText(updatedBody, { exact: true })).toHaveCount(0);
    await expect.poll(async () => await reviewByAuthor(user.id)).toBeNull();
    await expect
      .poll(async () => (await getMaterial(material.id)).review_count)
      .toBe(material.review_count);
  } finally {
    await deleteAuthUsersByEmail(user.email);
  }
});
