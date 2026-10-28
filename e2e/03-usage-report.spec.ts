import { expect, test } from "@playwright/test";

import {
  createGeneralUser,
  createMaterial,
  deleteAuthUsersByEmail,
  deleteMaterial,
  usageReportByAuthor,
  usageReportPlots,
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
    await page.getByRole("button", { name: /^作物：/ }).click();
    await page.getByRole("searchbox", { name: "作物を検索" }).fill("トマト");
    await page
      .getByRole("button", { name: /^トマト/ })
      .first()
      .click();
    await page.getByRole("button", { name: "下書き保存" }).click();
    await expect(page.getByRole("region", { name: "レポートの通知" })).toContainText(
      "下書きを保存しました",
    );
    await expect.poll(async () => (await usageReportByAuthor(user.id))?.status).toBe("draft");

    await fillUsageReportForSubmission(page, "桃太郎");
    await page.getByLabel("足す品種名").fill("アイコ");
    await page.getByRole("button", { name: "品種を足す" }).click();
    await page.getByLabel("足す比較した資材の名前").fill("ノビテク");
    await page.getByRole("button", { name: "比較した資材を足す" }).click();
    await page.getByRole("checkbox", { name: "アイコ・ノビテク" }).uncheck();
    await page.getByLabel("全区に共通の説明").fill("1区10株、3反復。かん水と施肥は全区同じ。");
    await page.getByRole("button", { name: "下書き保存" }).click();
    await expect(page.getByRole("region", { name: "レポートの通知" })).toContainText(
      "下書きを保存しました",
    );
    await page.reload();
    await expect(page.getByRole("checkbox", { name: "アイコ・ノビテク" })).not.toBeChecked();
    await expect(page.getByRole("checkbox", { name: "アイコ・無処理" })).toBeChecked();
    await page.getByRole("checkbox", { name: "資材を使った日（処理日）を記入した" }).check();
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
    expect(await usageReportPlots(pending.id)).toEqual([
      "桃太郎／untreated",
      "桃太郎／posted",
      "桃太郎／compared",
      "アイコ／untreated",
      "アイコ／posted",
    ]);

    await page.context().clearCookies();
    await page.goto(`/reports/${pending.id}`);
    await expect(page.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
  } finally {
    await deleteAuthUsersByEmail(user.email);
    await deleteMaterial(material.id);
  }
});

test("2つのタブの新規下書きは1件だけ保存し、競合したタブの入力を残す", async ({ page }) => {
  const user = await createGeneralUser("usageconflict");
  const material = await createMaterial("usageconflict");
  const reportPath = `/materials/${material.id}/report/new`;
  try {
    await loginGeneral(page, user, reportPath);
    const second = await page.context().newPage();
    await second.goto(reportPath);
    await expect(second.getByRole("button", { name: "下書き保存" })).toBeVisible();
    await page.getByRole("button", { name: "下書き保存" }).click();
    await expect(page.getByRole("region", { name: "レポートの通知" })).toContainText(
      "下書きを保存しました",
    );
    const saved = await usageReportByAuthor(user.id);
    if (saved === null) throw new Error("先に保存した下書きがありません。");
    await second
      .getByRole("textbox", { name: "結果・感想", exact: true })
      .fill("別のタブで入力した観察結果");
    await second.getByRole("button", { name: "下書き保存" }).click();
    await expect(second.getByRole("region", { name: "レポートの通知" })).toContainText(
      "この資材には下書きまたは確認中のレポートがあります",
    );
    await expect(second.getByRole("textbox", { name: "結果・感想", exact: true })).toHaveValue(
      "別のタブで入力した観察結果",
    );
    expect((await usageReportByAuthor(user.id))?.id).toBe(saved.id);
    await second.close();
  } finally {
    await deleteAuthUsersByEmail(user.email);
    await deleteMaterial(material.id);
  }
});
