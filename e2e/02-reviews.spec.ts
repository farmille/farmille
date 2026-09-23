import { expect, test } from "@playwright/test";

import {
  createGeneralUser,
  createMaterial,
  createReview,
  deleteAuthUsersByEmail,
  deleteMaterial,
  getMaterial,
  helpfulVoteCount,
  reviewByAuthor,
  reviewCropNames,
} from "./support/test-data";
import { loginGeneral } from "./support/ui";

test("@smoke 感想口コミ投稿、集計反映、編集、削除", async ({ page }) => {
  const user = await createGeneralUser("review");
  const material = await createMaterial("review");

  const body = `E2E感想口コミ_${user.id}`;
  const updatedBody = `${body}_更新済み`;

  try {
    await loginGeneral(page, user);
    await page.goto(`/materials/${material.id}/review/new`);
    const cropSearch = page.getByRole("textbox", { name: "作目" });
    await cropSearch.fill("トマト");
    await page.getByRole("button", { name: "トマトを選択", exact: true }).click();
    await cropSearch.fill("ミニトマト");
    await page.getByRole("button", { name: "ミニトマトを選択", exact: true }).click();
    await page.getByRole("radio", { name: "4", exact: true }).check();
    await page.getByLabel("感想口コミ本文").fill(body);
    await page
      .getByRole("checkbox", { name: /実際に使用した感想を、使用条件や感じた変化/ })
      .check();
    await page.getByRole("button", { name: "投稿する" }).click();

    await expect(page).toHaveURL(new RegExp(`/materials/${material.id}\\?review=posted`));
    const postedCard = page.getByRole("article").filter({ hasText: body });
    await expect(postedCard.getByText(body, { exact: true })).toBeVisible();
    await expect(postedCard.getByText("ミニトマト", { exact: true })).toBeVisible();
    await expect
      .poll(async () => (await getMaterial(material.id)).review_count)
      .toBe(material.review_count + 1);
    await expect.poll(async () => (await getMaterial(material.id)).avg_rating).toBe(4);

    const createdReview = await reviewByAuthor(user.id);
    if (createdReview === null) throw new Error("投稿した感想口コミが見つかりません。");
    await expect.poll(async () => await reviewCropNames(createdReview.id)).toEqual(["ミニトマト"]);

    for (const path of ["/", "/me", `/users/${user.id}`]) {
      await page.goto(path);
      if (path === "/") {
        await page
          .getByRole("navigation", { name: "感想口コミの表示順", exact: true })
          .getByRole("link", { name: "新着順", exact: true })
          .click();
        await expect(page).toHaveURL(/reviews=newest#home-reviews$/);
      }
      if (path === "/me") {
        await page
          .getByRole("navigation", { name: "投稿の種類" })
          .getByRole("link", { name: /^感想口コミ/ })
          .click();
        await expect(page).toHaveURL(/tab=reviews$/);
      }
      const reviewCard = page.getByRole("article").filter({ hasText: body });
      await expect(reviewCard.getByText(body, { exact: true })).toBeVisible();
      await expect(reviewCard.getByText("ミニトマト", { exact: true })).toBeVisible();
    }

    await page.goto(`/materials/${material.id}`);
    const reviewCard = page.getByRole("article").filter({ hasText: body });
    await reviewCard.getByRole("link", { name: "編集" }).click();
    await expect(page.getByRole("button", { name: "ミニトマトを削除", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "トマトを削除", exact: true })).toHaveCount(0);
    await page.getByRole("radio", { name: "5", exact: true }).check();
    await page.getByLabel("感想口コミ本文").fill(updatedBody);
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
    await deleteMaterial(material.id);
  }
});

test("資材詳細で感想口コミの参考になったを押すと、その場でカウントが増減する", async ({ page }) => {
  const author = await createGeneralUser("helpful-author");
  const viewer = await createGeneralUser("helpful-viewer");
  const material = await createMaterial("helpful");

  const body = `E2E参考になった感想口コミ_${author.id}`;

  try {
    await createReview({
      materialId: material.id,
      authorUserId: author.id,
      rating: 4,
      body,
    });

    await loginGeneral(page, viewer);
    await page.goto(`/materials/${material.id}`);

    const helpful = page
      .getByRole("article")
      .filter({ hasText: body })
      .getByRole("button", { name: /参考になった/ });

    await expect(helpful).toHaveText("参考になった0");
    await expect(helpful).toHaveAttribute("aria-pressed", "false");

    await helpful.click();

    await expect(helpful).toHaveText("参考になった1");
    await expect(helpful).toHaveAttribute("aria-pressed", "true");
    await expect.poll(async () => await helpfulVoteCount(viewer.id)).toBe(1);

    await helpful.click();

    await expect(helpful).toHaveText("参考になった0");
    await expect(helpful).toHaveAttribute("aria-pressed", "false");
    await expect.poll(async () => await helpfulVoteCount(viewer.id)).toBe(0);
  } finally {
    await deleteAuthUsersByEmail(author.email);
    await deleteAuthUsersByEmail(viewer.email);
    await deleteMaterial(material.id);
  }
});
