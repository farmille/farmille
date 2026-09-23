import { expect, test } from "@playwright/test";

import {
  createGeneralUser,
  createMaterial,
  deleteAuthUsersByEmail,
  deleteMaterial,
  usageReportByAuthor,
} from "./support/test-data";
import { fillUsageReportForSubmission, loginGeneral } from "./support/ui";

test("実証詳細レポートの下書き保存、提出、pending の公開側 404", async ({ page }) => {
  const user = await createGeneralUser("usage");
  const material = await createMaterial("usage");

  const reportPath = `/materials/${material.id}/report/new`;

  try {
    await loginGeneral(page, user, reportPath);
    await page.getByLabel("作目").fill("トマト");
    await page.getByRole("button", { name: "トマトを選択", exact: true }).first().click();
    await page.getByRole("button", { name: "下書き保存" }).click();
    await expect(page.getByRole("status")).toHaveText("下書きを保存しました。");
    await expect.poll(async () => (await usageReportByAuthor(user.id))?.status).toBe("draft");

    await fillUsageReportForSubmission(page);
    await page
      .getByLabel("＋ 写真を挿入", { exact: true })
      .first()
      .setInputFiles("e2e/fixtures/report.png");
    await page.getByLabel("写真の説明", { exact: true }).fill("検証用写真");
    await expect(page.getByRole("img", { name: "検証用写真", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "公開に進む" }).click();
    await expect.poll(async () => (await usageReportByAuthor(user.id))?.status).toBe("pending");
    await expect(page.getByRole("heading", { name: "レポートは提出済みです" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "レポートは提出済みです" })).toBeVisible();

    const pending = await usageReportByAuthor(user.id);
    if (pending === null) {
      throw new Error("提出した実証詳細レポートを取得できませんでした。");
    }
    expect(pending.status).toBe("pending");

    await page.context().clearCookies();
    await page.goto(`/reports/${pending.id}`);
    await expect(page.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
  } finally {
    await deleteAuthUsersByEmail(user.email);
    await deleteMaterial(material.id);
  }
});
