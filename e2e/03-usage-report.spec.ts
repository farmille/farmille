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
    await page.getByRole("button", { name: "下書き保存" }).click();
    await expect(page.getByRole("region", { name: "レポートの通知" })).toContainText(
      "下書きを保存しました",
    );
    await page.goto("/me");
    await expect(page.getByText("作物未選択", { exact: true })).toBeVisible();
    await page.goto(reportPath);
    await page.getByRole("button", { name: /^使用対象作目：/ }).click();
    await page.getByRole("searchbox", { name: "使用対象作目を検索" }).fill("トマト");
    await page
      .getByRole("button", { name: /^トマト/ })
      .first()
      .click();
    await page.getByRole("button", { name: "下書き保存" }).click();
    await expect(page.getByRole("region", { name: "レポートの通知" })).toContainText(
      "下書きを保存しました",
    );
    await expect.poll(async () => (await usageReportByAuthor(user.id))?.status).toBe("draft");

    await fillUsageReportForSubmission(page);
    await page.getByRole("button", { name: "調査項目を追加" }).click();
    await page.getByLabel("調査項目2の名前", { exact: true }).fill("草丈");
    await page.getByRole("button", { name: /^資料のグラフ・表を差し込む/ }).click();
    await page.getByLabel(/写真・PDFを選ぶ/).setInputFiles("e2e/fixtures/report.png");
    await page.getByLabel("画像のタイトル").fill("検証用写真");
    await page.getByRole("button", { name: "ページに入れる" }).click();
    await expect(page.getByRole("img", { name: "検証用写真", exact: true })).toBeVisible();
    await page.getByRole("checkbox", { name: /氏名や連絡先などが写っていないか/ }).check();
    await page.getByRole("checkbox", { name: /秘密保持契約に反しない/ }).check();
    await page.getByRole("button", { name: "投稿する" }).click();
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
