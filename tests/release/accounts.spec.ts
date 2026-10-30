import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import { loginAdminAndEnrollMfa, loginGeneral } from "../../e2e/support/ui";
import type { Database } from "../../src/types/database.types";

test("一般・メーカー・運営の本番フローと承認後の非公開を確認する", async ({
  page,
  browser,
}, testInfo) => {
  const keyPath = process.env.FARMILLE_RELEASE_SECRET_FILE;

  if (!keyPath) throw new Error("検証用の接続キーのファイルを指定してください");

  const db = createClient<Database>(
    "https://sajxnypkbybuzsqdguaa.supabase.co",
    readFileSync(keyPath, "utf8").trim(),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const token = `release-${randomUUID().slice(0, 8)}`;
  const manufacturerName = `動作確認用_${token}`;
  const materialId = randomUUID();
  const futureMaterialId = randomUUID();
  const admin = { email: `${token}-admin@example.test`, password: `${randomUUID()}aA1!` };

  const general = {
    email: `${token}-general@example.test`,
    password: `${randomUUID()}aA1!`,
    handle: token,
  };

  const authIds: string[] = [];
  const failures: unknown[] = [];
  let sellerId: string | null = null;

  const adminContext = await browser.newContext({
    baseURL: testInfo.project.use.baseURL,
    viewport: { width: 1280, height: 900 },
  });

  const adminPage = await adminContext.newPage();
  await page.goto("/login");

  if (new URL(page.url()).origin !== new URL(String(testInfo.project.use.baseURL)).origin) {
    await adminContext.close();
    throw new Error(
      "検証対象へのアクセスが外部の認証画面に転送されました。テストデータは作成していません。",
    );
  }

  const preflight = await db.from("materials").select("id").limit(1);

  if (preflight.error || preflight.data.length === 0) {
    await adminContext.close();
    throw new Error("本番の資材スキーマとデータを確認できません。テストデータは作成していません。");
  }

  try {
    for (const account of [
      { ...admin, type: "admin" },
      { ...general, type: "general" },
    ]) {
      const { data, error } = await db.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        app_metadata: { account_type: account.type },
      });

      if (error || !data.user)
        throw new Error(`検証アカウントの作成に失敗しました：${error?.code}`);
      authIds.push(data.user.id);

      if (account.type === "general") {
        const profile = await db
          .from("profiles")
          .insert({ user_id: data.user.id, handle: general.handle, standpoint: "other" });

        if (profile.error)
          throw new Error(`検証プロフィールの作成に失敗しました：${profile.error.code}`);
        await loginGeneral(page, { ...general, id: data.user.id }, "/me");
        await expect(page.getByText(general.handle, { exact: true })).toBeVisible();
        await page.screenshot({ path: testInfo.outputPath("general-sp.png"), fullPage: true });
        await page.goto("/me/edit");
        await expect(page.getByLabel("ハンドルネーム")).toHaveValue(general.handle);
        await page.goto("/admin");
        await expect(page.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
        await page.context().clearCookies();
      }
    }

    const material = await db
      .from("materials")
      .insert({ id: materialId, name: manufacturerName, manufacturer_name: manufacturerName });

    if (material.error) throw new Error(`検証資材の作成に失敗しました：${material.error.code}`);
    await page.goto("/sellers/apply");
    await page.getByLabel("メーカー名（法人名）").fill(manufacturerName);
    await page.getByLabel("ご希望のログインID").fill(token);
    await page.getByLabel("連絡先メールアドレス").fill(`${token}@example.test`);
    await page.getByLabel("ご担当者名").fill("動作確認担当");
    await page.getByLabel("本社・主な拠点の所在地").fill("東京都");
    await page.getByLabel("主な地域").selectOption("全国");
    await page.getByRole("button", { name: "申請する" }).click();
    await expect(page.getByRole("heading", { name: "申請を受け付けました" })).toBeVisible();

    const application = await db
      .from("seller_accounts")
      .select("id")
      .eq("login_id", token)
      .single();

    if (application.error || !application.data)
      throw new Error("検証用メーカー申請を取得できません");
    sellerId = application.data.id;
    await loginAdminAndEnrollMfa(adminPage, admin, `/admin/sellers/${sellerId}`);
    await adminPage.getByLabel("紐づける資材メーカー").selectOption(manufacturerName);
    await adminPage.screenshot({ path: testInfo.outputPath("admin-link-pc.png"), fullPage: true });
    await adminPage.getByRole("button", { name: "承認して共有ログインを発行" }).click();
    await expect(adminPage.getByText("共有ログインを発行しました。")).toBeVisible();

    const approved = await db
      .from("seller_accounts")
      .select("auth_user_id")
      .eq("id", sellerId)
      .single();

    if (approved.error || !approved.data?.auth_user_id)
      throw new Error("承認済み検証アカウントを取得できません");
    authIds.push(approved.data.auth_user_id);

    const issuedPassword = await adminPage
      .getByText("初期パスワード", { exact: true })
      .locator("..")
      .locator("span")
      .nth(1)
      .textContent();

    if (!issuedPassword) throw new Error("発行パスワードを取得できません");
    await page.goto("/sellers/login");
    await page.getByLabel("Farmille企業会員ID").fill(token);
    await page.getByLabel("パスワード").fill(issuedPassword.trim());
    await page.getByRole("button", { name: "ログインする" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.screenshot({ path: testInfo.outputPath("manufacturer-sp.png"), fullPage: true });

    const future = await db
      .from("materials")
      .insert({
        id: futureMaterialId,
        name: `${manufacturerName}_追加`,
        manufacturer_name: manufacturerName,
      })
      .select("seller_id")
      .single();

    if (future.error) throw new Error(`承認後の資材追加に失敗しました：${future.error.code}`);
    expect(future.data.seller_id).toBe(sellerId);
    await page.goto(`/dashboard/materials/${materialId}`);
    await page.getByLabel("紹介文").fill(`${token}による変更の確認`);
    await page.getByRole("button", { name: "変更を申請" }).click();
    await expect(page).toHaveURL(/\/dashboard\/materials\/requests\/[0-9a-f-]+$/);
    const updateId = page.url().split("/").pop();

    if (!updateId) throw new Error("変更申請IDを取得できません");
    await adminPage.goto(`/admin/materials/requests/${updateId}`);
    await adminPage.getByRole("button", { name: "承認して反映" }).click();
    await expect(adminPage.getByText("申請を承認して公開内容へ反映しました。")).toBeVisible();
    await page.goto(`/materials/${materialId}`);
    await expect(page.getByText(`${token}による変更の確認`, { exact: true })).toBeVisible();
    await page.goto(`/dashboard/materials/${materialId}`);
    await page.getByLabel("掲載終了理由").fill("動作確認用資材の非公開確認");
    await page.getByRole("button", { name: "掲載終了を申請" }).click();
    await expect(page).toHaveURL(/\/dashboard\/materials\/requests\/[0-9a-f-]+$/);
    const archiveId = page.url().split("/").pop();

    if (!archiveId) throw new Error("非公開申請IDを取得できません");
    await adminPage.goto(`/admin/materials/requests/${archiveId}`);
    await adminPage.getByRole("button", { name: "承認して反映" }).click();
    await expect(adminPage.getByText("申請を承認して公開内容へ反映しました。")).toBeVisible();
    await page.context().clearCookies();
    await page.goto(`/materials/${materialId}`);
    await expect(
      page.getByRole("main").getByText("資材が見つかりません", { exact: true }),
    ).toBeVisible();

    for (const width of [375, 1280]) {
      await page.setViewportSize({ width, height: 900 });

      for (const path of ["/", "/search", "/articles", "/sellers", "/signup", "/login"]) {
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        await expect(page.getByText("ページを表示できませんでした", { exact: true })).toHaveCount(
          0,
        );
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
      }
    }
  } catch (error) {
    failures.push(error);
  } finally {
    await adminContext.close();

    if (sellerId) {
      const requests = await db.from("material_change_requests").delete().eq("seller_id", sellerId);

      if (requests.error) failures.push(new Error("検証用の資材申請履歴の片付けに失敗しました"));
    }

    for (const id of [materialId, futureMaterialId]) {
      const result = await db
        .from("materials")
        .delete()
        .eq("id", id)
        .eq("manufacturer_name", manufacturerName);

      if (result.error)
        failures.push(new Error(`検証資材の片付けに失敗しました：${result.error.code}`));
    }

    const application = await db
      .from("seller_accounts")
      .select("id,auth_user_id")
      .eq("login_id", token)
      .maybeSingle();

    if (application.error) failures.push(new Error("検証申請の片付け前の照合に失敗しました"));

    if (application.data) {
      if (application.data.auth_user_id && !authIds.includes(application.data.auth_user_id))
        authIds.push(application.data.auth_user_id);

      const result = await db
        .from("seller_accounts")
        .delete()
        .eq("id", application.data.id)
        .eq("login_id", token);

      if (result.error) failures.push(new Error("検証用メーカー申請の片付けに失敗しました"));
    }

    for (const id of authIds) {
      const result = await db.auth.admin.deleteUser(id);

      if (result.error) failures.push(new Error("検証アカウントの片付けに失敗しました"));
    }

    const result = await db.from("manufacturers").delete().eq("name", manufacturerName);

    if (result.error) failures.push(new Error("検証メーカー名の片付けに失敗しました"));
  }

  if (failures.length > 0)
    throw new AggregateError(failures, "本番検証または検証データの片付けに失敗しました");
});
