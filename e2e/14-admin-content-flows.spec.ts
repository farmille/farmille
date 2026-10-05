import { expect, test } from "@playwright/test";

import {
  articleBySeller,
  articleMaterialIds,
  cleanupArticleImages,
  createContentAdmin,
  deleteOwnedTag,
  editorialReportById,
  materialByOwnedName,
  materialTagNames,
  tagByOwnedName,
} from "./support/admin-content-flows";
import {
  cleanupSellerByLoginId,
  createApprovedSeller,
  createGeneralUser,
  createMaterial,
  createPendingUsageReport,
  deleteAuthUsersByEmail,
  deleteMaterial,
  getMaterial,
  uniqueToken,
} from "./support/test-data";
import {
  fillUsageReportForSubmission,
  loginAdminAndEnrollMfa,
  loginGeneral,
  loginSeller,
} from "./support/ui";

test("メーカー記事の画像・Markdown・資材紐づけを保存し、公開・非公開・削除を反映する", async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000);
  const seller = await createApprovedSeller("article-lifecycle");
  const material = await createMaterial("article-linked");
  const title = `記事_${uniqueToken("lifecycle")}`;
  const editedTitle = `${title}_改訂`;
  const anonymous = await browser.newPage({ viewport: { width: 375, height: 812 } });
  try {
    await loginSeller(page, seller);
    await page.goto("/dashboard/articles/new");
    await page.getByLabel("タイトル", { exact: false }).fill(title);
    const body = page.getByLabel("本文（Markdown）", { exact: false });
    await body.fill("## 試験結果\n初回の観察です。\n[試験資料](https://example.com/trial)");
    await page
      .getByLabel("ヒーロー画像", { exact: false })
      .setInputFiles("e2e/fixtures/report.png");
    await expect(page.getByRole("button", { name: "ヒーロー画像を外す" })).toBeVisible();
    await page.locator('input[type="file"]').nth(1).setInputFiles("e2e/fixtures/report.png");
    await expect(body).toHaveValue(/!\[画像\]\(http:\/\/127\.0\.0\.1:54321\/storage/);
    await page.getByLabel("資材を検索して追加", { exact: false }).fill(material.name);
    await page.getByRole("button", { name: "検索", exact: true }).click();
    await page
      .getByRole("button", { name: `${material.name} ${material.manufacturer_name}`, exact: true })
      .click();
    await page.getByRole("button", { name: "下書き保存", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard\/articles\/[0-9a-f-]+\/edit$/);
    const draft = await articleBySeller(seller.id);
    if (draft === null) throw new Error("Article draft was not saved.");
    expect(draft.status).toBe("draft");
    expect(draft.hero_image_url).toContain(`/article-images/${seller.id}/`);
    expect(await articleMaterialIds(draft.id)).toEqual([material.id]);
    await anonymous.goto(`/articles/${draft.id}`);
    await expect(anonymous.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("タイトル", { exact: false })).toHaveValue(title);
    await expect(body).toHaveValue(draft.body);
    await page.getByRole("tab", { name: "プレビュー", exact: true }).click();
    await expect(page.getByRole("heading", { name: "試験結果", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "試験資料", exact: true })).toHaveAttribute(
      "href",
      "https://example.com/trial",
    );
    await page.getByRole("tab", { name: "編集", exact: true }).click();
    await page.getByLabel("タイトル", { exact: false }).fill(editedTitle);
    await body.fill(`${draft.body}\n改訂して保存した観察です。`);
    await page.getByRole("button", { name: "公開する", exact: true }).click();
    await expect.poll(async () => (await articleBySeller(seller.id))?.status).toBe("published");
    await anonymous.goto(`/articles/${draft.id}`);
    await expect(anonymous.getByRole("heading", { name: editedTitle, exact: true })).toBeVisible();
    await expect(anonymous.getByText("改訂して保存した観察です。", { exact: true })).toBeVisible();
    await expect(anonymous.getByRole("img", { name: "画像", exact: true })).toBeVisible();
    await expect(anonymous.getByRole("link", { name: material.name, exact: true })).toHaveAttribute(
      "href",
      `/materials/${material.id}`,
    );
    await anonymous.screenshot({
      path: test.info().outputPath("article-published-375.png"),
      fullPage: true,
    });
    await page.goto("/dashboard/articles");
    const card = page.getByRole("region", { name: editedTitle, exact: true });
    await card.getByRole("button", { name: "非公開にする", exact: true }).click();
    await expect.poll(async () => (await articleBySeller(seller.id))?.status).toBe("draft");
    await anonymous.reload();
    await expect(anonymous.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
    await card.getByRole("link", { name: "編集", exact: true }).click();
    await page.getByRole("button", { name: "外す", exact: true }).click();
    await page.getByRole("button", { name: "ヒーロー画像を外す", exact: true }).click();
    await page.getByRole("button", { name: "下書き保存", exact: true }).click();
    await expect.poll(async () => articleMaterialIds(draft.id)).toEqual([]);
    await expect.poll(async () => (await articleBySeller(seller.id))?.hero_image_url).toBeNull();
    await page.goto("/dashboard/articles");
    await card.getByRole("button", { name: "公開する", exact: true }).click();
    await expect.poll(async () => (await articleBySeller(seller.id))?.status).toBe("published");
    await card.getByRole("button", { name: "削除", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "記事を削除しますか？" });
    await expect(dialog).toContainText("公開中の記事です。");
    await dialog.getByRole("button", { name: "削除する", exact: true }).click();
    await expect.poll(async () => articleBySeller(seller.id)).toBeNull();
    await expect(card).toHaveCount(0);
    await anonymous.reload();
    await expect(anonymous.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
  } finally {
    await anonymous.close();
    await cleanupArticleImages(seller.id);
    await deleteMaterial(material.id);
    await cleanupSellerByLoginId(seller.loginId);
  }
});

test("運営が資材と検索タグを登録・編集し、使用中の削除を防ぎ、掲載と編集権と監査を管理する", async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000);
  const admin = await createContentAdmin("admin-material-tag");
  const seller = await createApprovedSeller("grant-revocation");
  const materialName = `E2E資材_${uniqueToken("admin-created")}`;
  const tagName = uniqueToken("tag-created");
  const renamedTag = `${tagName}-edited`;
  let materialId: string | null = null;
  const anonymous = await browser.newPage({ viewport: { width: 375, height: 812 } });
  try {
    await loginAdminAndEnrollMfa(page, admin, "/admin/tags");
    const tagCreate = page.getByRole("textbox", { name: "タグ名", exact: true }).locator("..");
    await tagCreate.getByRole("combobox", { name: "分類", exact: true }).selectOption("concern");
    await tagCreate.getByRole("textbox", { name: "タグ名", exact: true }).fill(tagName);
    await tagCreate.getByRole("spinbutton", { name: "並び順", exact: true }).fill("999");
    await tagCreate.getByRole("button", { name: "追加", exact: true }).click();
    await expect.poll(async () => (await tagByOwnedName(tagName))?.sort_order).toBe(999);
    await page
      .locator("summary")
      .filter({ hasText: /^悩み/ })
      .click();
    const tagRow = page
      .getByRole("textbox", { name: `${tagName} の名前`, exact: true })
      .locator("..");
    await tagRow.getByRole("textbox", { name: `${tagName} の名前`, exact: true }).fill(renamedTag);
    await tagRow.getByRole("spinbutton", { name: `${tagName} の並び順`, exact: true }).fill("998");
    await tagRow.getByRole("button", { name: "保存", exact: true }).click();
    await expect.poll(async () => (await tagByOwnedName(renamedTag))?.sort_order).toBe(998);
    await page.goto("/admin/materials/new");
    await page.getByLabel("資材名", { exact: false }).fill(materialName);
    await page.getByLabel("メーカー名", { exact: false }).fill("E2E 運営登録メーカー");
    await page.getByLabel("紹介文", { exact: false }).fill("運営が登録した資材の説明です。");
    await page.getByRole("checkbox", { name: renamedTag, exact: true }).check();
    await page.getByRole("button", { name: "登録する", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/materials\/[0-9a-f-]+\?created=1$/);
    materialId = await materialByOwnedName(materialName);
    if (materialId === null) throw new Error("Admin-created material was not persisted.");
    expect(await materialTagNames(materialId)).toEqual([renamedTag]);
    await page.getByLabel("紹介文", { exact: false }).fill("保存して更新した紹介文です。");
    await page.getByLabel("公式 URL", { exact: false }).fill("https://example.com/owned-material");
    await page.getByRole("button", { name: "保存する", exact: true }).click();
    await expect(page.getByText("資材を更新しました。", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("紹介文", { exact: false })).toHaveValue(
      "保存して更新した紹介文です。",
    );
    await anonymous.goto(`/materials/${materialId}`);
    await expect(anonymous.getByRole("heading", { name: materialName, exact: true })).toBeVisible();
    await expect(
      anonymous.getByText("保存して更新した紹介文です。", { exact: true }),
    ).toBeVisible();
    await page.goto("/admin/tags");
    await page
      .locator("summary")
      .filter({ hasText: /^悩み/ })
      .click();
    const usedTag = page
      .getByRole("textbox", { name: `${renamedTag} の名前`, exact: true })
      .locator("..");
    await expect(usedTag).toContainText("使用 1 件");
    await expect(usedTag.getByRole("button", { name: "削除", exact: true })).toBeDisabled();
    await page.goto(`/admin/materials/${materialId}`);
    await page.getByRole("combobox", { name: "公開状態", exact: false }).selectOption("archived");
    await page.getByRole("button", { name: "公開状態を更新", exact: true }).click();
    await expect(page.getByText("資材を掲載終了にしました。", { exact: true })).toBeVisible();
    await anonymous.reload();
    await expect(
      anonymous.getByRole("main").getByText("資材が見つかりません", { exact: true }),
    ).toBeVisible();
    await page.getByRole("combobox", { name: "公開状態", exact: false }).selectOption("published");
    await page.getByRole("button", { name: "公開状態を更新", exact: true }).click();
    await expect(page.getByText("資材を公開状態へ戻しました。", { exact: true })).toBeVisible();
    await anonymous.reload();
    await expect(anonymous.getByRole("heading", { name: materialName, exact: true })).toBeVisible();
    await page.getByRole("checkbox", { name: renamedTag, exact: true }).uncheck();
    await page.getByRole("button", { name: "保存する", exact: true }).click();
    await expect.poll(async () => materialTagNames(materialId ?? "")).toEqual([]);
    await page.getByLabel("編集権を付与するメーカー").selectOption(seller.id);
    await page.getByLabel("確認資料の保管先または受付番号").fill(`E2E-GRANT-${materialId}`);
    await page.getByRole("button", { name: "編集権を更新する" }).click();
    await expect.poll(async () => (await getMaterial(materialId ?? "")).seller_id).toBe(seller.id);
    await page.getByLabel("編集権を付与するメーカー").selectOption("");
    await page.getByRole("button", { name: "編集権を更新する" }).click();
    await expect(
      page.getByText("編集権を取り消しました。公開中の情報は保持しています。", { exact: true }),
    ).toBeVisible();
    expect((await getMaterial(materialId)).seller_id).toBeNull();
    await expect(
      page.getByText(new RegExp(`取消済み／書類：.*E2E-GRANT-${materialId}`)),
    ).toBeVisible();
    const auditNote = uniqueToken("visible-audit");
    await page.getByLabel("掲載後の確認結果").selectOption("correction_requested");
    await page.getByLabel("確認した内容と理由").fill(auditNote);
    await page.getByRole("button", { name: "確認記録を保存", exact: true }).click();
    await expect(
      page.getByText("確認記録を保存しました。メーカーも記録を閲覧できます。", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(page.getByText(new RegExp(`／${auditNote}$`))).toBeVisible();
    await page.screenshot({
      path: test.info().outputPath("admin-material-audit-375.png"),
      fullPage: true,
    });
    await page.goto("/admin/tags");
    await page
      .locator("summary")
      .filter({ hasText: /^悩み/ })
      .click();
    const unusedTag = page
      .getByRole("textbox", { name: `${renamedTag} の名前`, exact: true })
      .locator("..");
    await expect(unusedTag).toContainText("使用 0 件");
    await unusedTag.getByRole("button", { name: "削除", exact: true }).click();
    await expect.poll(async () => tagByOwnedName(renamedTag)).toBeNull();
    await expect(
      page.getByRole("textbox", { name: `${renamedTag} の名前`, exact: true }),
    ).toHaveCount(0);
  } finally {
    await anonymous.close();
    materialId ??= await materialByOwnedName(materialName);
    if (materialId !== null) await deleteMaterial(materialId);
    await deleteOwnedTag(tagName);
    await deleteOwnedTag(renamedTag);
    await cleanupSellerByLoginId(seller.loginId);
    await deleteAuthUsersByEmail(admin.email);
  }
});

test("編集局の調整保存と差し戻し理由の必須検証と公開を確認する", async ({ page, browser }) => {
  const admin = await createContentAdmin("editorial-transitions");
  const author = await createGeneralUser("editorial-author");
  const material = await createMaterial("editorial-transitions");
  const publish = await createPendingUsageReport({
    materialId: material.id,
    authorUserId: author.id,
    title: uniqueToken("editorial-publish"),
  });
  const decline = await createPendingUsageReport({
    materialId: material.id,
    authorUserId: author.id,
    title: uniqueToken("editorial-decline"),
  });
  const anonymous = await browser.newPage({ viewport: { width: 375, height: 812 } });
  try {
    await loginAdminAndEnrollMfa(page, admin, `/admin/usage-reports/${publish.id}`);
    const editedTitle = uniqueToken("editorial-edited");
    await page.getByLabel("タイトル", { exact: true }).fill(editedTitle);
    await page
      .getByLabel("観察した変化", { exact: true })
      .fill("編集局で確認して補足した観察です。");
    await page.getByLabel("編集局メモ（内部）", { exact: true }).fill("公開前の内部確認記録");
    await page.getByRole("button", { name: "編集内容を保存", exact: true }).click();
    await expect(page.getByText("編集内容を保存しました。", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("タイトル", { exact: true })).toHaveValue(editedTitle);
    expect(await editorialReportById(publish.id)).toMatchObject({
      status: "pending",
      title: editedTitle,
      observed_change: "編集局で確認して補足した観察です。",
      editor_note: "公開前の内部確認記録",
    });
    await anonymous.goto(`/reports/${publish.id}`);
    await expect(anonymous.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
    await page.getByRole("button", { name: "公開する", exact: true }).click();
    await expect
      .poll(async () => (await editorialReportById(publish.id))?.status)
      .toBe("published");
    await expect(page.getByLabel("タイトル", { exact: true })).toBeDisabled();
    await anonymous.reload();
    await expect(anonymous.getByRole("heading", { name: editedTitle, exact: true })).toBeVisible();
    expect(await anonymous.content()).not.toContain("公開前の内部確認記録");
    await page.goto(`/admin/usage-reports/${decline.id}`);
    await page.getByRole("button", { name: "差し戻す", exact: true }).click();
    await expect(
      page.getByText("タイトル・本文・まとめ・差し戻し理由を入力してください。", { exact: true }),
    ).toBeVisible();
    expect((await editorialReportById(decline.id))?.status).toBe("pending");
    await page
      .getByLabel("編集局メモ（内部）", { exact: true })
      .fill("処理日と比較条件を追記してください。");
    await page.getByRole("button", { name: "差し戻す", exact: true }).click();
    await expect.poll(async () => (await editorialReportById(decline.id))?.status).toBe("declined");
    await page.reload();
    await expect(page.getByLabel("編集局メモ（内部）", { exact: true })).toHaveValue(
      "処理日と比較条件を追記してください。",
    );
    await expect(page.getByLabel("タイトル", { exact: true })).toBeDisabled();
    await anonymous.goto(`/reports/${decline.id}`);
    await expect(anonymous.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
    await page.screenshot({
      path: test.info().outputPath("editorial-declined-375.png"),
      fullPage: true,
    });
  } finally {
    await anonymous.close();
    await deleteMaterial(material.id);
    await deleteAuthUsersByEmail(author.email);
    await deleteAuthUsersByEmail(admin.email);
  }
});

test("実証レポートの複数グラフと区を再読込し、別画面の下書き更新で上書きを防ぐ", async ({
  page,
}) => {
  const author = await createGeneralUser("advanced-report");
  const material = await createMaterial("advanced-report");
  const reportPath = `/materials/${material.id}/report/new`;
  const stalePage = await page.context().newPage();
  try {
    await loginGeneral(page, author, reportPath);
    await page.getByLabel("作目", { exact: true }).fill("トマト");
    await page.getByRole("button", { name: "トマトを選択", exact: true }).first().click();
    await fillUsageReportForSubmission(page);
    await page.getByRole("button", { name: "4 比較・使用結果", exact: true }).click();
    await page.getByRole("button", { name: "グラフ1の題を編集", exact: true }).click();
    await page.getByLabel("グラフの題（任意）", { exact: true }).fill("施用7日後");
    await page
      .getByRole("button", { name: "＋ この調査項目で、別の時期のグラフを追加", exact: true })
      .click();
    await expect(page.getByRole("region", { name: "グラフ 2", exact: true })).toBeVisible();
    await page.getByLabel("グラフの題（任意）", { exact: true }).press("Enter");
    await page.getByRole("button", { name: "グラフ2を削除", exact: true }).click();
    await expect(page.getByRole("region", { name: "グラフ 2", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "元に戻す", exact: true }).click();
    await expect(page.getByRole("region", { name: "グラフ 2", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "グラフ2の題を編集", exact: true }).click();
    await page.getByLabel("グラフの題（任意）", { exact: true }).fill("施用14日後");
    await page.getByLabel("グラフの題（任意）", { exact: true }).press("Enter");
    for (const [index, value] of ["95±1 a", "82±2 b"].entries()) {
      await page
        .getByRole("button", { name: `グラフ2の区${index + 1}の数値を編集`, exact: true })
        .click();
      await page.getByLabel(`グラフ2の区${index + 1}の数値`, { exact: true }).fill(value);
      await page.getByLabel(`グラフ2の区${index + 1}の数値`, { exact: true }).press("Enter");
    }
    await page.getByRole("button", { name: "下書き保存", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("下書きを保存しました。");
    await page.reload();
    await page.getByRole("button", { name: "4 比較・使用結果", exact: true }).click();
    await expect(page.getByRole("region", { name: "グラフ 1", exact: true })).toContainText(
      "施用7日後",
    );
    await expect(page.getByRole("region", { name: "グラフ 2", exact: true })).toContainText(
      "施用14日後",
    );
    await expect(page.getByRole("img", { name: "処理区 95±1 a", exact: true })).toBeVisible();
    await expect(page.getByRole("img", { name: "無処理区 82±2 b", exact: true })).toBeVisible();
    await stalePage.goto(reportPath);
    await stalePage.getByRole("button", { name: "2 結果", exact: true }).click();
    await stalePage.getByLabel(/^結果・感想/).fill("別画面の保存できなかった入力を保持します。");
    await page.getByRole("button", { name: "2 結果", exact: true }).click();
    await page.getByLabel(/^結果・感想/).fill("先に保存した画面の観察結果です。");
    await page.getByRole("button", { name: "下書き保存", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("下書きを保存しました。");
    await stalePage.getByRole("button", { name: "下書き保存", exact: true }).click();
    await expect(stalePage.getByRole("status")).toHaveText(
      "別の画面で下書きが更新されています。入力内容を控えてから再読み込みしてください。",
    );
    await expect(stalePage.getByLabel(/^結果・感想/)).toHaveValue(
      "別画面の保存できなかった入力を保持します。",
    );
    await page.reload();
    await page.getByRole("button", { name: "2 結果", exact: true }).click();
    await expect(page.getByLabel(/^結果・感想/)).toHaveValue("先に保存した画面の観察結果です。");
    await stalePage.screenshot({
      path: test.info().outputPath("report-conflict-375.png"),
      fullPage: true,
    });
  } finally {
    await stalePage.close();
    await deleteMaterial(material.id);
    await deleteAuthUsersByEmail(author.email);
  }
});
