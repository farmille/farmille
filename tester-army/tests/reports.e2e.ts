import { expect } from "e2e";
import { createPublishedUsageReport, usageReportByAuthor } from "../../e2e/support/test-data";
import { materialTest } from "../support/fixtures";
import { fillReportForSubmission, loginMember } from "../support/ui";

materialTest(
  "レポート下書きを再開して写真と比較グラフを提出する",
  async ({ app, screen, browser, member, material }) => {
    const path = `/materials/${material.id}/report/new`;
    await loginMember(app, screen, browser, member, path);
    await screen.getByRole("button", "下書き保存").tap();
    await expect(screen.getByRole("status")).toHaveText("下書きを保存しました。");
    await screen.getByLabel("作目").fill("トマト");
    await screen.getByRole("button", "トマトを選択").first().tap();
    await screen.getByRole("button", "下書き保存").tap();
    await expect(screen.getByRole("status")).toHaveText("下書きを保存しました。");
    await browser.reload();
    await expect(screen.getByRole("button", "トマトを削除")).toBeVisible();
    await fillReportForSubmission(screen);
    await screen.getByLabel("＋ 写真を挿入").first().setInputFiles("e2e/fixtures/report.png");
    await screen.getByLabel("写真の説明").fill("検証用の比較写真");
    await expect(screen.getByRole("image", "検証用の比較写真")).toBeVisible();
    await screen.getByRole("button", "公開に進む").tap();
    await expect(screen.getByRole("heading", "レポートは提出済みです")).toBeVisible();
    await expect.poll(async () => (await usageReportByAuthor(member.id))?.status).toBe("pending");
    const report = await usageReportByAuthor(member.id);
    if (report === null) throw new Error("提出したレポートがありません。");
    await browser.reload();
    await expect(screen.getByRole("heading", "レポートは提出済みです")).toBeVisible();
    await app.clearState();
    await app.open(`/reports/${report.id}`);
    await expect(screen.getByRole("heading", "ページが見つかりません")).toBeVisible();
  },
);

materialTest(
  "未入力のレポートもプレビューと下書き保存で保持する",
  async ({ app, screen, browser, member, material }) => {
    await loginMember(app, screen, browser, member, `/materials/${material.id}/report/new`);
    await screen.getByRole("button", "プレビュー").tap();
    await expect(screen.getByRole("main")).toContainText(material.name);
    await expect(screen.getByRole("button", "下書き保存")).toBeVisible();
    await screen.getByRole("button", "下書き保存").tap();
    await expect(screen.getByRole("status")).toHaveText("下書きを保存しました。");
    await expect.poll(async () => (await usageReportByAuthor(member.id))?.status).toBe("draft");
  },
);

materialTest(
  "会員限定の全文をログイン後に表示しログアウト後は返さない",
  async ({ app, screen, browser, member, material }) => {
    const privateText = `会員限定末尾_${member.id}`;
    const report = await createPublishedUsageReport({
      materialId: material.id,
      authorUserId: member.id,
      title: "検証用の会員限定レポート",
      observedChange: "公開する観察記録です。".repeat(30) + privateText,
    });
    const path = `/reports/${report.id}`;
    await app.open(path);
    await expect(screen.getByRole("link", "無料会員登録して続きを読む")).toHaveAttribute(
      "href",
      `/signup/general?next=${encodeURIComponent(path)}`,
    );
    expect(await browser.evaluate(() => document.documentElement.outerHTML)).not.toContain(
      privateText,
    );
    await loginMember(app, screen, browser, member, path);
    await expect(screen.getByText(privateText, { exact: false })).toBeVisible();
    await app.clearState();
    await app.open(path);
    await expect(screen.getByRole("link", "無料会員登録して続きを読む")).toBeVisible();
    expect(await browser.evaluate(() => document.documentElement.outerHTML)).not.toContain(
      privateText,
    );
  },
);
