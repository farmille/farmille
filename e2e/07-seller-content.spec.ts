import { expect, type Page, test } from "@playwright/test";
import { captureScreenFlow } from "./support/screen-flow";

import { E2E_ADMIN_ACCOUNTS } from "./support/admin-accounts";
import {
  cleanupSellerByLoginId,
  createApprovedSeller,
  createGeneralUser,
  createReview,
  deleteAuthUsersByEmail,
  deleteMaterial,
  uniqueToken,
} from "./support/test-data";
import { loginAdminAndEnrollMfa, loginSeller } from "./support/ui";

function requestIdFromUrl(url: string): string {
  const id = /\/dashboard\/materials\/requests\/([0-9a-f-]+)$/.exec(url)?.[1];
  if (id === undefined) throw new Error(`申請IDをURLから取得できません：${url}`);
  return id;
}

function adminMaterialIdFromUrl(url: string): string {
  const id = /\/admin\/materials\/([0-9a-f-]+)(?:\?|$)/.exec(url)?.[1];
  if (id === undefined) throw new Error(`資材IDをURLから取得できません：${url}`);
  return id;
}

async function captureScreen(page: Page, filename: string, fullPage = true): Promise<void> {
  if (process.env.CAPTURE_SCREEN_FLOW !== "1") return;
  await expect(page.getByText("読み込んでいます", { exact: true })).toHaveCount(0);
  await captureScreenFlow(page, filename, fullPage);
}

test("メーカーの資材追加・変更・掲載終了は運営承認後に反映される", async ({ browser, page }) => {
  const seller = await createApprovedSeller("content");
  const reviewer = await createGeneralUser("archive-reviewer");
  const adminSeedMaterialName = `E2E資材_${uniqueToken("adminseed")}`;
  const description = `E2E一次情報_${uniqueToken("description")}`;
  const generalUse = `E2E一般用途_${uniqueToken("generaluse")}`;
  const newMaterialName = `E2E資材_${uniqueToken("manufacturercreate")}`;
  let adminSeedMaterialId: string | null = null;
  let createdMaterialId: string | null = null;
  const adminContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const adminPage = await adminContext.newPage();

  try {
    await loginAdminAndEnrollMfa(
      adminPage,
      E2E_ADMIN_ACCOUNTS.materialGovernance,
      "/admin/materials/requests",
    );
    await adminPage.goto("/admin/materials");
    await captureScreen(adminPage, "25-admin-materials.png");
    await adminPage.goto("/admin/materials/new");
    await adminPage.getByLabel("資材名").fill(adminSeedMaterialName);
    await adminPage.getByLabel("メーカー名").fill(seller.officialName);
    await captureScreen(adminPage, "26-admin-material-new.png");
    await adminPage.getByRole("button", { name: "登録する" }).click();
    await expect(adminPage).toHaveURL(/\/admin\/materials\/[0-9a-f-]+\?created=1$/);
    adminSeedMaterialId = adminMaterialIdFromUrl(adminPage.url());
    await expect(adminPage.getByText("資材を登録しました。", { exact: true })).toBeVisible();
    await adminPage.getByLabel("claim 元のメーカー").selectOption(seller.id);
    await adminPage.getByRole("button", { name: "claim を更新する" }).click();
    await expect(
      adminPage.getByText(
        "claim を紐づけました。メーカーが情報を確認するまで確認済み表示は付きません。",
        { exact: true },
      ),
    ).toBeVisible();

    await page.goto(`/materials/${adminSeedMaterialId}`);
    await expect(page.getByRole("heading", { name: adminSeedMaterialName })).toBeVisible();
    await expect(page.getByText("メーカー確認済み", { exact: true })).toHaveCount(0);
    await captureScreen(page, "27-public-material-unverified.png");

    await loginSeller(page, seller);

    await page.goto("/dashboard/materials");
    await captureScreen(page, "13-seller-materials.png");

    await page.goto(`/dashboard/materials/${adminSeedMaterialId}`);
    await captureScreen(page, "14-seller-material-detail-unverified.png");
    const confirmButton = page.getByRole("button", { name: "この情報を確認済みにする" });
    await confirmButton.scrollIntoViewIfNeeded();
    await captureScreen(page, "29-seller-material-confirm.png", false);
    await confirmButton.click();
    await expect(page.getByText("確認済み", { exact: true })).toBeVisible();
    await page.goto(`/materials/${adminSeedMaterialId}`);
    await expect(page.getByText("メーカー確認済み", { exact: true }).first()).toBeVisible();
    await captureScreen(page, "15-public-material-verified.png");

    await page.goto(`/dashboard/materials/${adminSeedMaterialId}`);
    await page.getByLabel("紹介文").scrollIntoViewIfNeeded();
    await captureScreen(page, "31-seller-material-edit.png", false);
    await page.getByLabel("紹介文").fill(description);
    await page.getByLabel("一般用途").fill(generalUse);
    await page.getByLabel("使い方").fill("E2Eでは1000倍に希釈して使用します。");
    await page.getByRole("button", { name: "変更を申請" }).click();
    await expect(page).toHaveURL(/\/dashboard\/materials\/requests\/[0-9a-f-]+$/);
    const updateRequestId = requestIdFromUrl(page.url());
    await expect(page.getByText("承認待ち", { exact: true })).toBeVisible();
    await captureScreen(page, "16-seller-update-request.png");

    await page.goto(`/materials/${adminSeedMaterialId}`);
    await expect(page.getByText("メーカー確認済み", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(generalUse, { exact: true })).toHaveCount(0);

    await adminPage.goto(`/admin/materials/requests/${updateRequestId}`);
    await expect(adminPage.getByText(generalUse, { exact: true })).toBeVisible();
    await captureScreen(adminPage, "17-admin-update-request.png");
    await adminPage.getByRole("button", { name: "承認して反映" }).click();
    await expect(adminPage.getByText("申請を承認して公開内容へ反映しました。")).toBeVisible();

    await page.goto(`/materials/${adminSeedMaterialId}`);
    await expect(page.getByText(generalUse, { exact: true })).toBeVisible();

    await page.goto("/dashboard/materials/new");
    await page.getByLabel("資材名").fill(newMaterialName);
    await page.getByLabel("紹介文").fill("メーカーから新規登録するE2E資材です。");
    await captureScreen(page, "18-seller-material-new.png");
    await page.getByRole("button", { name: "新規登録を申請" }).click();
    await expect(page).toHaveURL(/\/dashboard\/materials\/requests\/[0-9a-f-]+$/);
    const createRequestId = requestIdFromUrl(page.url());
    await captureScreen(page, "19-seller-create-request.png");

    await adminPage.goto("/admin/materials/requests");
    await captureScreen(adminPage, "20-admin-material-requests.png");
    await adminPage.goto(`/admin/materials/requests/${createRequestId}`);
    await expect(adminPage.getByText(newMaterialName, { exact: true }).first()).toBeVisible();
    await captureScreen(adminPage, "21-admin-create-request.png");
    await adminPage.getByRole("button", { name: "承認して反映" }).click();
    await expect(adminPage.getByText("申請を承認して公開内容へ反映しました。")).toBeVisible();

    await page.goto(`/dashboard/materials/requests/${createRequestId}`);
    const publicMaterialHref = await page
      .getByRole("link", { name: "公開画面を見る" })
      .getAttribute("href");
    createdMaterialId = /\/materials\/([0-9a-f-]+)$/.exec(publicMaterialHref ?? "")?.[1] ?? null;
    if (createdMaterialId === null) throw new Error("承認済み新規資材のIDを取得できません。");

    await page.goto(`/materials/${createdMaterialId}`);
    await expect(page.getByRole("heading", { name: newMaterialName })).toBeVisible();
    await expect(page.getByText("メーカー確認済み", { exact: true }).first()).toBeVisible();
    await captureScreen(page, "22-public-created-material.png");
    await createReview({
      materialId: createdMaterialId,
      authorUserId: reviewer.id,
      rating: 4,
      body: "非公開後もデータを保持するレビュー",
    });

    await page.goto(`/dashboard/materials/${createdMaterialId}`);
    await page.getByLabel("掲載終了理由").scrollIntoViewIfNeeded();
    await captureScreen(page, "30-seller-archive-form.png", false);
    await page.getByLabel("掲載終了理由").fill("E2Eで販売終了を確認するため");
    await page.getByRole("button", { name: "掲載終了を申請" }).click();
    await expect(page).toHaveURL(/\/dashboard\/materials\/requests\/[0-9a-f-]+$/);
    const archiveRequestId = requestIdFromUrl(page.url());
    await captureScreen(page, "23-seller-archive-request.png");

    await adminPage.goto(`/admin/materials/requests/${archiveRequestId}`);
    await captureScreen(adminPage, "28-admin-archive-request.png");
    await adminPage.getByRole("button", { name: "承認して反映" }).click();
    await expect(adminPage.getByText("申請を承認して公開内容へ反映しました。")).toBeVisible();

    await page.goto(`/materials/${createdMaterialId}`);
    await expect(page.getByText(/この資材は掲載を終了しています/)).toBeVisible();
    await expect(page.getByRole("link", { name: "レビューを書く" })).toHaveCount(0);
    await captureScreen(page, "24-public-archived-material.png");

    const publicPage = await browser.newPage();
    try {
      await publicPage.goto(`/materials/${createdMaterialId}`);
      await expect(
        publicPage.getByRole("main").getByText("資材が見つかりません", { exact: true }),
      ).toBeVisible();
      await publicPage.goto("/");
      await expect(
        publicPage.getByText("ページを表示できませんでした", { exact: true }),
      ).toHaveCount(0);
      await expect(
        publicPage.getByText("非公開後もデータを保持するレビュー", { exact: true }),
      ).toHaveCount(0);
    } finally {
      await publicPage.close();
    }

    await page.goto(`/search?filters=name:${encodeURIComponent(newMaterialName)}`);
    await expect(page.getByText("条件に合う資材が見つかりませんでした")).toBeVisible();
  } finally {
    await adminContext.close();
    if (createdMaterialId !== null) await deleteMaterial(createdMaterialId);
    if (adminSeedMaterialId !== null) await deleteMaterial(adminSeedMaterialId);
    await cleanupSellerByLoginId(seller.loginId);
    await deleteAuthUsersByEmail(reviewer.email);
  }
});
