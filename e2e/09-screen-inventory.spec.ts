import { expect, test, type Page } from "@playwright/test";
import { captureScreenFlow } from "./support/screen-flow";

import { E2E_ADMIN_ACCOUNTS } from "./support/admin-accounts";
import {
  cleanupSellerByLoginId,
  createApprovedSeller,
  createGeneralUser,
  createMaterial,
  createPendingUsageReport,
  createReview,
  deleteAuthUsersByEmail,
  deleteMaterial,
} from "./support/test-data";
import { loginAdminAndEnrollMfa, loginGeneral, loginSeller } from "./support/ui";

/** 遷移資料の実画面を、使い捨てのローカル検証データで撮影する。 */
async function capture(page: Page, path: string, name: string): Promise<void> {
  await page.goto(path);
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByText("読み込んでいます", { exact: true })).toHaveCount(0);
  expect(new URL(page.url()).pathname).toBe(path);
  await expect(page.getByText("ページを表示できませんでした", { exact: true })).toHaveCount(0);
  await captureScreenFlow(page, `${name}.png`);
}

test("アカウント別の画面一覧を撮影する", async ({ page }) => {
  test.skip(process.env.CAPTURE_SCREEN_FLOW !== "1", "画面遷移資料を更新するときに実行する");
  test.setTimeout(120_000);
  const user = await createGeneralUser("screen");
  const seller = await createApprovedSeller("screen");
  const material = await createMaterial("screen", seller.id);
  const unreviewedMaterial = await createMaterial("screen-unreviewed", seller.id);
  const review = await createReview({
    materialId: material.id,
    authorUserId: user.id,
    rating: 4,
    body: "葉色と根の張りを観察しました。継続して比較します。",
  });
  const report = await createPendingUsageReport({
    materialId: material.id,
    authorUserId: user.id,
    title: "トマト栽培での使用記録",
  });
  try {
    for (const [path, name] of [
      ["/search", "34-search"],
      ["/articles", "35-articles"],
      ["/password-reset", "36-password-reset"],
      [`/materials/${material.id}`, "37-material"],
      [`/materials/${material.id}/reviews`, "38-reviews"],
      [`/materials/${material.id}/articles`, "39-material-articles"],
      [`/sellers/${seller.id}`, "40-public-seller"],
    ])
      await capture(page, path, name);

    await loginGeneral(page, user, "/me");
    for (const [path, name] of [
      ["/me/edit", "41-profile-edit"],
      ["/me/saved", "42-saved"],
      ["/me/saved/compare", "43-compare"],
      ["/post", "44-post"],
      ["/password-reset/update", "45-password-update"],
      [`/materials/${unreviewedMaterial.id}/review/new`, "46-review-new"],
      [`/materials/${material.id}/review/${review.id}/edit`, "47-review-edit"],
      [`/materials/${material.id}/report/new`, "48-report-new"],
    ])
      await capture(page, path, name);

    await page.context().clearCookies();
    await loginSeller(page, seller);
    await capture(page, "/dashboard/articles", "49-seller-articles");
    await capture(page, "/dashboard/articles/new", "50-article-new");
    await page.getByRole("textbox", { name: "タイトル" }).fill("根の生育を観察するポイント");
    await page
      .getByRole("textbox", { name: "本文（Markdown）" })
      .fill("圃場で根の張りと葉色を記録し、処理区と無処理区を比較します。");
    await page.getByRole("button", { name: "公開する", exact: true }).click();
    await expect(page).toHaveURL(/\/articles\/[0-9a-f-]+$/);
    const articleId = /\/articles\/([0-9a-f-]+)$/.exec(page.url())?.[1];
    if (articleId === undefined) throw new Error("記事の公開URLがありません。");
    const articlePath = `/articles/${articleId}`;
    await capture(page, `/dashboard${articlePath}/edit`, "51-article-edit");
    await capture(page, articlePath, "52-public-article");

    await page.context().clearCookies();
    await loginAdminAndEnrollMfa(page, E2E_ADMIN_ACCOUNTS.screenInventory, "/admin");
    for (const [path, name] of [
      ["/admin", "53-admin-home"],
      ["/admin/tags", "54-admin-tags"],
      ["/admin/reports", "55-admin-reports"],
      ["/admin/usage-reports", "56-admin-usage-reports"],
      [`/admin/usage-reports/${report.id}`, "57-admin-report-edit"],
      [`/admin/materials/${material.id}`, "58-admin-material-edit"],
    ])
      await capture(page, path, name);
    await page.goto(`/admin/usage-reports/${report.id}`);
    await page.getByRole("button", { name: "公開する", exact: true }).click();
    await expect(page.getByText("使用レポートを公開しました。")).toBeVisible();
    await capture(page, `/reports/${report.id}`, "59-public-report");
  } finally {
    await deleteMaterial(unreviewedMaterial.id);
    await deleteMaterial(material.id);
    await cleanupSellerByLoginId(seller.loginId);
    await deleteAuthUsersByEmail(user.email);
  }
});
