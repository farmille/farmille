import { expect, test } from "@playwright/test";

import {
  createGeneralUser,
  deleteAuthUsersByEmail,
  listSeedMaterials,
  usageReportByAuthor,
} from "./support/test-data";
import { fillUsageReportForSubmission, loginGeneral } from "./support/ui";

test("使用レポートの下書き保存、提出、pending の公開側 404", async ({ page }) => {
  const user = await createGeneralUser("usage");
  const material = (await listSeedMaterials())[1];

  if (material === undefined) {
    throw new Error("使用レポート対象のシード資材が見つかりません。");
  }

  const reportPath = `/materials/${material.id}/report/new`;

  try {
    await loginGeneral(page, user, reportPath);
    await page.getByLabel("使用作物").fill("トマト");
    await page
      .getByRole("button", { name: /なす科果菜類.*トマト/ })
      .first()
      .click();
    await page.getByRole("button", { name: "下書き保存" }).click();
    await expect(page.getByRole("status")).toHaveText("下書きを保存しました。");
    await expect.poll(async () => (await usageReportByAuthor(user.id))?.status).toBe("draft");

    await fillUsageReportForSubmission(page);
    await page.getByRole("button", { name: "レポートを投稿する" }).click();
    await expect.poll(async () => (await usageReportByAuthor(user.id))?.status).toBe("pending");
    await expect(page.getByRole("heading", { name: "レポートは提出済みです" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "レポートは提出済みです" })).toBeVisible();

    const pending = await usageReportByAuthor(user.id);
    if (pending === null) {
      throw new Error("提出した使用レポートを取得できませんでした。");
    }
    expect(pending.status).toBe("pending");

    await page.context().clearCookies();
    await page.goto(`/reports/${pending.id}`);
    await expect(page.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
  } finally {
    await deleteAuthUsersByEmail(user.email);
  }
});
