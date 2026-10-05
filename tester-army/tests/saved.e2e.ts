import { expect } from "e2e";
import {
  createGeneralUser,
  createReview,
  createPublishedUsageReport,
  deleteAuthUsersByEmail,
} from "../../e2e/support/test-data";
import { materialTest } from "../support/fixtures";
import { loginMember } from "../support/ui";

materialTest(
  "お気に入りを比較し一覧から解除する",
  async ({ app, screen, browser, member, material, secondMaterial }) => {
    await loginMember(app, screen, browser, member);
    for (const item of [material, secondMaterial]) {
      await app.open(`/materials/${item.id}`);
      await screen.getByRole("button", "お気に入りに追加").tap();
      await expect(screen.getByRole("button", "お気に入りから解除")).toBeVisible();
    }
    await app.open("/me/saved");
    const compare = screen.getByRole("button", "比較する");
    await expect(compare).toBeDisabled();
    await screen.getByRole("checkbox", "比較に含める").nth(0).check();
    await expect(compare).toBeDisabled();
    await screen.getByRole("checkbox", "比較に含める").nth(1).check();
    await compare.tap();
    await expect(browser).toHaveURL(/\/me\/saved\/compare\?ids=/);
    await expect(screen.getByRole("table")).toContainText(material.name);
    await expect(screen.getByRole("table")).toContainText(secondMaterial.name);
    await app.open("/me/saved");
    await screen.getByRole("button", "リストから外す").first().tap();
    await expect(screen.getByRole("checkbox", "比較に含める")).toHaveCount(1);
    await browser.reload();
    await expect(screen.getByRole("checkbox", "比較に含める")).toHaveCount(1);
    await screen.getByRole("button", "リストから外す").tap();
    await expect(screen.getByText("保存した資材はまだありません")).toBeVisible();
  },
);

materialTest(
  "口コミとレポートを保存し保存した投稿から解除する",
  async ({ app, screen, browser, member, material }) => {
    const author = await createGeneralUser("army-saved-author");
    const body = `E2E保存口コミ_${author.id}`;
    const title = `E2E保存レポート_${author.id}`;
    try {
      await createReview({ materialId: material.id, authorUserId: author.id, rating: 3, body });
      const report = await createPublishedUsageReport({
        materialId: material.id,
        authorUserId: author.id,
        title,
        observedChange: "処理区の観察結果を記録しました。",
      });
      await loginMember(app, screen, browser, member, `/materials/${material.id}`);
      await screen
        .getByRole("article")
        .filter({ hasText: body })
        .getByRole("button", "投稿を保存")
        .tap();
      await app.open(`/reports/${report.id}`);
      await screen.getByRole("button", "投稿を保存").tap();
      await app.open("/me/saved");
      await expect(screen.getByText(body)).toBeVisible();
      await expect(screen.getByText(title)).toBeVisible();
      await screen.getByRole("button", "保存を解除").first().tap();
      await browser.reload();
      await expect(screen.getByRole("button", "保存を解除")).toHaveCount(1);
      await screen.getByRole("button", "保存を解除").tap();
      await browser.reload();
      await expect(screen.getByText("まだ保存した投稿がありません。")).toBeVisible();
    } finally {
      await deleteAuthUsersByEmail(author.email);
    }
  },
);
