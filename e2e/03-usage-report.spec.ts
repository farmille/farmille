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
    expect(await usageReportPlots(pending.id)).toEqual(["-／untreated", "-／posted"]);

    await page.context().clearCookies();
    await page.goto(`/reports/${pending.id}`);
    await expect(page.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
  } finally {
    await deleteAuthUsersByEmail(user.email);
    await deleteMaterial(material.id);
  }
});

test("品種と比較した資材を足し、試した組み合わせの表から区を作って提出する", async ({ page }) => {
  const user = await createGeneralUser("usageplots");
  const material = await createMaterial("usageplots");
  const reportPath = `/materials/${material.id}/report/new`;

  try {
    await loginGeneral(page, user, reportPath);
    await page.getByRole("button", { name: /^作物：/ }).click();
    await page.getByRole("searchbox", { name: "作物を検索" }).fill("トマト");
    await page
      .getByRole("button", { name: /^トマト/ })
      .first()
      .click();
    await fillUsageReportForSubmission(page, "桃太郎");
    await expect(page.getByRole("checkbox", { name: "桃太郎・無処理" })).toHaveCount(0);

    await page.getByLabel("足す品種名").fill("アイコ");
    await page.getByRole("button", { name: "品種を足す" }).click();
    await page.getByLabel("足す比較した資材の名前").fill("ノビテク");
    await page.getByRole("button", { name: "比較した資材を足す" }).click();
    await page.getByRole("checkbox", { name: "アイコ・ノビテク" }).uncheck();
    await expect(page.getByLabel("区の名前")).toHaveCount(5);
    await expect(page.getByLabel("区の名前").nth(2)).toHaveValue("桃太郎・ノビテク");
    await page.getByLabel("全区に共通の説明").fill("1区10株、3反復。かん水と施肥は全区同じ。");

    await page.getByRole("button", { name: "下書き保存" }).click();
    await expect(page.getByRole("region", { name: "レポートの通知" })).toContainText(
      "下書きを保存しました",
    );
    await page.reload();
    await expect(page.getByRole("checkbox", { name: "アイコ・ノビテク" })).not.toBeChecked();
    await expect(page.getByRole("checkbox", { name: "アイコ・無処理" })).toBeChecked();

    await page.getByRole("button", { name: "プレビュー", exact: true }).click();
    const preview = page.getByRole("dialog");
    await expect(preview.getByRole("heading", { name: "品種：アイコ" })).toBeVisible();
    await preview.getByRole("button", { name: "編集に戻る" }).click();

    await page.getByRole("checkbox", { name: "資材を使った日（処理日）を記入した" }).check();
    await page.getByRole("button", { name: "投稿する" }).click();
    await expect.poll(async () => (await usageReportByAuthor(user.id))?.status).toBe("pending");
    const pending = await usageReportByAuthor(user.id);
    if (pending === null) throw new Error("提出した実証詳細レポートを取得できませんでした。");
    expect(await usageReportPlots(pending.id)).toEqual([
      "桃太郎／untreated",
      "桃太郎／posted",
      "桃太郎／compared",
      "アイコ／untreated",
      "アイコ／posted",
    ]);
  } finally {
    await deleteAuthUsersByEmail(user.email);
    await deleteMaterial(material.id);
  }
});
