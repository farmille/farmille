import { expect, test } from "@playwright/test";
import { TOTP } from "otpauth";
import {
  cleanupSellerByLoginId,
  createApprovedSeller,
  createGeneralUser,
  deleteAuthUser,
  uniqueToken,
} from "./support/test-data";
import { loginAdminAndEnrollMfa, loginGeneral, loginSeller } from "./support/ui";
import {
  accountDb,
  captureAccount,
  checkedData,
  createDurableAdmin,
  createDurableSeller,
  promoteAdmin,
  verifyExistingMfa,
} from "./support/account-flows";

test("一般プロフィールの保存・再読み込み・公開設定とエラー時の入力保持", async ({
  page,
  browser,
}, info) => {
  const user = await createGeneralUser("profile");
  const duplicate = await createGeneralUser("profile-duplicate");
  const handle = `公開_${uniqueToken("profile")}`.slice(0, 30);
  const bio = "圃場での観察を記録するプロフィールです。";
  const affiliation = "E2E 作物研究会";
  const db = accountDb();
  const viewer = await browser.newContext({ viewport: { width: 375, height: 812 } });
  try {
    checkedData(
      await db
        .from("profiles")
        .update({ prefecture_code: 13 })
        .eq("user_id", user.id)
        .select()
        .single(),
    );
    checkedData(
      await db
        .from("profile_contact_details")
        .insert({
          user_id: user.id,
          family_name: "非公開の姓",
          given_name: "非公開の名",
          city: "千代田区",
          postal_code: "1000001",
          phone: "090-1111-2222",
          street_address: "非公開住所1-2-3",
          building_name: "非公開ビル401",
        })
        .select()
        .single(),
    );
    await loginGeneral(page, user, "/me/edit");
    await page.getByLabel("ハンドルネーム").fill(duplicate.handle);
    await page.getByLabel("自己紹介").fill(bio);
    await page.getByLabel("主な作目").fill("トマト");
    await page.getByRole("button", { name: /^トマト（/ }).click();
    await page.getByLabel("所属", { exact: false }).fill(affiliation);
    await page.getByRole("button", { name: "所属を追加" }).click();
    await page.getByLabel("リンク", { exact: false }).fill("https://example.test/farm");
    await page.getByRole("button", { name: "保存する" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "このハンドルネームはすでに使われています。" }),
    ).toHaveCount(2);
    await expect(page.getByLabel("自己紹介")).toHaveValue(bio);
    await expect(page.getByRole("button", { name: `${affiliation} ×`, exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "トマト ×", exact: true })).toBeVisible();
    await page.getByLabel("ハンドルネーム").fill(handle);
    await page.getByLabel("リンク", { exact: false }).fill("javascript:alert(1)");
    await page.getByRole("button", { name: "保存する" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "リンクはhttps://またはhttp://" }),
    ).toContainText("リンクはhttps://またはhttp://");
    await expect(page.getByLabel("ハンドルネーム")).toHaveValue(handle);
    await page.getByLabel("リンク", { exact: false }).fill("https://example.test/farm");
    await page.getByRole("button", { name: "保存する" }).click();
    await expect(page).toHaveURL(/\/me$/);
    await page.goto("/me/edit");
    await page.reload();
    await expect(page.getByLabel("ハンドルネーム")).toHaveValue(handle);
    await expect(page.getByLabel("自己紹介")).toHaveValue(bio);
    await expect(page.getByLabel("リンク", { exact: false })).toHaveValue(
      "https://example.test/farm",
    );
    await expect(page.getByRole("button", { name: "トマト ×", exact: true })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "市区町村も公開する" })).not.toBeChecked();
    const publicPage = await viewer.newPage();
    await publicPage.goto(`/users/${user.id}`);
    await expect(publicPage.getByRole("heading", { name: handle })).toBeVisible();
    await expect(publicPage.getByText(bio, { exact: true })).toBeVisible();
    await expect(publicPage.getByText(affiliation, { exact: true })).toBeVisible();
    await expect(
      publicPage.getByRole("link", { name: "https://example.test/farm" }),
    ).toHaveAttribute("href", "https://example.test/farm");
    await expect(publicPage.getByText(/生産者.*東京都/)).toBeVisible();
    await expect(publicPage.getByText(/千代田区/)).toHaveCount(0);
    await page.getByRole("checkbox", { name: "市区町村も公開する" }).check();
    await page.getByRole("button", { name: "保存する" }).click();
    await expect(page).toHaveURL(/\/me$/);
    await publicPage.reload();
    await expect(publicPage.getByText(/東京都.*千代田区/)).toBeVisible();
    for (const privateValue of [
      user.email,
      "非公開の姓",
      "非公開の名",
      "090-1111-2222",
      "1000001",
      "非公開住所1-2-3",
      "非公開ビル401",
    ]) {
      expect(await publicPage.content()).not.toContain(privateValue);
    }
    await captureAccount(publicPage, info, "general-public-profile-375");
    await page.goto("/me/edit");
    await page.getByRole("button", { name: "トマト ×", exact: true }).click();
    await page.getByRole("button", { name: `${affiliation} ×`, exact: true }).click();
    await page.getByRole("checkbox", { name: "市区町村も公開する" }).uncheck();
    await page.getByRole("button", { name: "保存する" }).click();
    await expect(page).toHaveURL(/\/me$/);
    await publicPage.reload();
    await expect(publicPage.getByText(affiliation, { exact: true })).toHaveCount(0);
    await expect(publicPage.getByText(/千代田区/)).toHaveCount(0);
  } finally {
    await viewer.close();
    await deleteAuthUser(duplicate.id);
    await deleteAuthUser(user.id);
  }
});

for (const role of ["general", "seller", "admin"] as const) {
  test(`${role}のパスキー登録・ログイン・削除キャンセル・削除後拒否`, async ({ page }, info) => {
    test.setTimeout(150_000);
    const general = role !== "seller" ? await createGeneralUser(`passkey-${role}`) : null;
    const seller = role === "seller" ? await createApprovedSeller("passkey") : null;
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("WebAuthn.enable");
    const { authenticatorId } = await cdp.send("WebAuthn.addVirtualAuthenticator", {
      options: {
        protocol: "ctap2",
        transport: "internal",
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    });
    let secret = "";
    let lastCode = "";
    const home = role === "admin" ? "/admin" : seller ? "/dashboard" : "/me";
    try {
      if (role === "admin" && general) {
        await promoteAdmin(general);
        secret = await loginAdminAndEnrollMfa(page, general, home);
        lastCode = new TOTP({ algorithm: "SHA1", digits: 6, period: 30, secret }).generate();
      } else if (seller) await loginSeller(page, seller);
      else if (general) await loginGeneral(page, general, home);
      await page.getByRole("link", { name: "パスキーを管理", exact: true }).click();
      await expect(
        page.getByText("パスキーはまだ登録されていません。", { exact: true }),
      ).toBeVisible();
      await page.getByRole("button", { name: "パスキーを登録する", exact: true }).click();
      await expect(page.getByText("パスキーを登録しました。", { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "削除", exact: true })).toHaveCount(1);
      const credentials = await cdp.send("WebAuthn.getCredentials", { authenticatorId });
      expect(credentials.credentials).toHaveLength(1);
      expect(credentials.credentials[0]?.rpId).toBe("localhost");
      await page.reload();
      await expect(page.getByRole("button", { name: "削除", exact: true })).toHaveCount(1);
      await page.getByRole("button", { name: "削除", exact: true }).click();
      await expect(page.getByRole("button", { name: "このパスキーを削除する" })).toBeVisible();
      await page.getByRole("button", { name: "キャンセル", exact: true }).click();
      await expect(page.getByRole("button", { name: "このパスキーを削除する" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "削除", exact: true })).toHaveCount(1);
      await captureAccount(page, info, `passkey-${role}-375`);
      await page.context().clearCookies();
      await page.goto(`/login?next=${encodeURIComponent(home)}`);
      await page.getByRole("button", { name: "パスキーでログイン", exact: true }).click();
      if (role === "admin") {
        await expect(page).toHaveURL(/\/admin\/mfa\?/);
        await page.goto("/account/passkeys");
        await expect(page).toHaveURL(/\/admin\/mfa\?next=%2Faccount%2Fpasskeys$/);
        await page.goto("/admin/company-applications");
        await expect(page).toHaveURL(/\/admin\/mfa\?/);
        await verifyExistingMfa(page, secret, lastCode);
        await expect(page).toHaveURL(/\/admin\/company-applications$/);
      } else await expect(page).toHaveURL((url) => url.pathname === home);
      await page.goto("/account/passkeys");
      await page.getByRole("button", { name: "削除", exact: true }).click();
      await page.getByRole("button", { name: "このパスキーを削除する", exact: true }).click();
      await expect(page.getByText("パスキーを削除しました。", { exact: true })).toBeVisible();
      await expect(
        page.getByText("パスキーはまだ登録されていません。", { exact: true }),
      ).toBeVisible();
      await page.reload();
      await expect(page.getByRole("button", { name: "削除", exact: true })).toHaveCount(0);
      await page.context().clearCookies();
      await page.goto(`/login?next=${encodeURIComponent(home)}`);
      await page.getByRole("button", { name: "パスキーでログイン", exact: true }).click();
      await expect(
        page.getByRole("alert").filter({ hasText: "パスキーの操作を完了できませんでした。" }),
      ).toContainText("パスキーの操作を完了できませんでした。");
      await expect(page).toHaveURL(/\/login\?/);
      await page.goto(home);
      await expect(page).toHaveURL(role === "seller" ? /\/sellers\/login\?/ : /\/login\?/);
    } finally {
      await cdp.send("WebAuthn.removeVirtualAuthenticator", { authenticatorId });
      await cdp.detach();
      if (seller) await cleanupSellerByLoginId(seller.loginId);
      if (general) await deleteAuthUser(general.id);
    }
  });
}

test("メーカー会社紹介の下書き・非公開・取り下げ・差し戻し・再送信・公開・履歴", async ({
  page,
  browser,
}, info) => {
  test.setTimeout(180_000);
  const seller = await createDurableSeller("profile");
  const other = await createApprovedSeller("profile-other");
  const admin = await createDurableAdmin();
  const adminContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const publicContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const publicPage = await publicContext.newPage();
  const operator = await adminContext.newPage();
  const text = `農業資材の会社紹介 ${seller.loginId}`;
  try {
    await loginSeller(page, seller);
    await page.goto("/dashboard/profile");
    await page.getByLabel("会社紹介", { exact: true }).fill(text);
    await page.getByLabel("公式サイトURL").fill("https://example.test/manufacturer");
    await page.getByRole("button", { name: "プレビュー", exact: true }).click();
    await expect(page.getByText(text, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "編集に戻る", exact: true }).click();
    await expect(page.getByLabel("会社紹介", { exact: true })).toHaveValue(text);
    await page.getByRole("button", { name: "下書きを保存", exact: true }).click();
    await expect(page.getByText("下書きを保存しました。", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("会社紹介", { exact: true })).toHaveValue(text);
    await publicPage.goto(`/sellers/${seller.id}`);
    await expect(publicPage.getByRole("heading", { name: seller.officialName })).toBeVisible();
    await expect(publicPage.getByText(text, { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "保存して表現確認へ送る", exact: true }).click();
    await expect(page.getByText("プロフィールの表現確認中です。", { exact: true })).toBeVisible();
    await expect(page.getByLabel("会社紹介", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "取り下げて編集を再開", exact: true }).click();
    await expect(page.getByLabel("会社紹介", { exact: true })).toHaveValue(text);
    await page.getByRole("button", { name: "保存して表現確認へ送る", exact: true }).click();
    await expect(page.getByText("プロフィールの表現確認中です。", { exact: true })).toBeVisible();
    await publicPage.reload();
    await expect(publicPage.getByText(text, { exact: true })).toHaveCount(0);
    await loginAdminAndEnrollMfa(operator, admin, "/admin/materials/expressions");
    const reviewCard = operator
      .locator("section")
      .filter({ has: operator.getByText(`${seller.officialName}のプロフィール`, { exact: true }) });
    await reviewCard.getByRole("link", { name: "会社紹介・ロゴ・リンクを確認" }).click();
    await operator
      .getByLabel("確認メモ・修正が必要な箇所")
      .fill("会社紹介の説明を詳しくしてください。");
    await operator.getByRole("button", { name: "修正を依頼", exact: true }).click();
    await expect(
      operator.getByText("この原稿の確認は終了しています。", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(page.getByText(/会社紹介の説明を詳しくしてください。/)).toBeVisible();
    const revised = `${text}。製品の情報を公開資料に基づいて案内します。`;
    await page.getByLabel("会社紹介", { exact: true }).fill(revised);
    await page.getByRole("button", { name: "保存して表現確認へ送る", exact: true }).click();
    await expect(page.getByText("プロフィールの表現確認中です。", { exact: true })).toBeVisible();
    await operator.goto("/admin/materials/expressions");
    await operator
      .locator("section")
      .filter({ has: operator.getByText(`${seller.officialName}のプロフィール`, { exact: true }) })
      .getByRole("link", { name: "会社紹介・ロゴ・リンクを確認" })
      .click();
    await expect(operator.getByText(revised, { exact: true })).toBeVisible();
    await operator.getByRole("button", { name: "表現確認を完了して反映", exact: true }).click();
    await expect(
      operator.getByText("この原稿の確認は終了しています。", { exact: true }),
    ).toBeVisible();
    await publicPage.reload();
    await expect(publicPage.getByText(revised, { exact: true })).toBeVisible();
    await expect(
      publicPage.getByRole("link", { name: "公式サイト", exact: false }),
    ).toHaveAttribute("href", "https://example.test/manufacturer");
    expect(await publicPage.content()).not.toContain(`${seller.loginId}@example.test`);
    await captureAccount(publicPage, info, "manufacturer-public-profile-375");
    await page.reload();
    const history = page.getByRole("link", { name: /公開済み/ }).first();
    const historyUrl = await history.getAttribute("href");
    if (!historyUrl) throw new Error("Published profile has no history link.");
    await history.click();
    await expect(page.getByText(revised, { exact: true })).toBeVisible();
    await page.context().clearCookies();
    await loginSeller(page, other);
    await page.goto(historyUrl);
    await expect(page.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
    await expect(page.getByText(revised, { exact: true })).toHaveCount(0);
  } finally {
    await adminContext.close();
    await publicContext.close();
    await cleanupSellerByLoginId(other.loginId);
  }
});
