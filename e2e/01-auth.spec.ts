import { expect, test, type Page } from "@playwright/test";
import { captureScreenFlow } from "./support/screen-flow";

import { createGeneralUser, deleteAuthUsersByEmail, uniqueToken } from "./support/test-data";
import { loginGeneral, signupGeneral } from "./support/ui";

async function captureAccountScreen(page: Page, filename: string): Promise<void> {
  if (process.env.CAPTURE_ACCOUNT_FLOW !== "1") return;

  await captureScreenFlow(page, filename);
}

test("@smoke 一般登録、ログイン、ログアウトとハンドル重複エラー", async ({ page }) => {
  const token = uniqueToken("auth");
  const email = `${token}@example.test`;
  const duplicateEmail = `${token}-duplicate@example.test`;
  const handle = `E2E_${token}`.slice(0, 30);
  const password = "Farmille-E2E-Signup-2026!";

  try {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "アカウントを作成" })).toBeVisible();
    await expect(page.getByRole("link", { name: "一般ユーザー登録へ" })).toHaveAttribute(
      "href",
      "/signup/general",
    );
    await expect(page.getByRole("link", { name: "メーカー向けページへ" })).toHaveAttribute(
      "href",
      "/sellers",
    );
    await captureAccountScreen(page, "01-account-choice.png");

    await page.goto("/signup/general");
    await expect(page.getByRole("heading", { name: "一般ユーザー登録" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: /^都道府県/ })).toBeVisible();
    await expect(page.getByText(/^あなたの立場必須\s*公開されます$/)).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(4);
    await expect(page.getByRole("radio", { name: "生産者", exact: true })).toBeVisible();
    await expect(
      page.getByRole("radio", { name: "JAグループ職員（営農指導員など）", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("radio", { name: /^行政関係者/ })).toBeVisible();
    await expect(
      page.getByRole("radio", {
        name: "その他（メーカー関係者、専門家、大学研究員など）",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByText("メーカー関係者", { exact: true })).toHaveCount(0);
    await captureAccountScreen(page, "02-general-signup.png");

    await signupGeneral(page, { handle, email, password });
    await expect(page).toHaveURL(/\/signup\/done$/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "登録が完了しました" })).toBeVisible();
    await captureAccountScreen(page, "07-general-signup-done.png");

    await page.goto("/me");
    await expect(page.getByText(handle, { exact: true })).toBeVisible();
    await captureAccountScreen(page, "09-mypage.png");
    await page.getByRole("link", { name: "表示情報を編集" }).click();
    await expect(page).toHaveURL(/\/me\/edit$/);
    await expect(page.getByRole("banner").getByText("表示情報編集", { exact: true })).toBeVisible();
    await expect(page.getByLabel("アバター")).toBeVisible();
    await expect(page.getByLabel("ハンドルネーム")).toBeVisible();
    await expect(page.getByRole("combobox", { name: /^都道府県/ })).toHaveCount(0);
    await expect(page.getByText("主な作目", { exact: true })).toHaveCount(0);
    await page.goto("/me");
    const sellerApplyLink = page.getByRole("link", {
      name: "メーカーアカウントを申請",
    });
    await expect(sellerApplyLink).toHaveAttribute("href", "/sellers?from=me");
    await sellerApplyLink.click();
    await expect(page).toHaveURL(/\/sellers\?from=me$/);
    await expect(
      page.getByRole("heading", { name: "Farmille 企業様向け利用ガイド" }),
    ).toBeVisible();
    const landingApplyLink = page.getByRole("link", { name: "申請フォームへ進む" });
    await expect(landingApplyLink).toHaveAttribute("href", "/sellers/apply?from=me");
    await landingApplyLink.click();
    await expect(page).toHaveURL(/\/sellers\/apply\?from=me$/);
    const backLink = page.getByRole("link", { name: "戻る" });
    await expect(backLink).toHaveAttribute("href", "/me");
    await backLink.click();
    await expect(page).toHaveURL(/\/me$/);
    await page.getByRole("button", { name: "ログアウト" }).click();
    await expect(page).toHaveURL("/");
    await captureAccountScreen(page, "08-home.png");

    await page.goto("/login");
    await captureAccountScreen(page, "06-general-login.png");
    await page.getByLabel("メールアドレス").fill(email);
    await page.getByLabel("パスワード").fill(password);
    await page.getByRole("button", { name: "ログインする" }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/me");
    await page.getByRole("button", { name: "ログアウト" }).click();

    await signupGeneral(page, { handle, email: duplicateEmail, password });
    await expect(
      page.getByRole("alert").filter({ hasText: "このハンドルネームはすでに使われています。" }),
    ).toHaveCount(2);
    await expect(page).toHaveURL(/\/signup\/general$/);
    await expect(page.getByLabel("番地", { exact: false })).toHaveValue("千代田1-1");
    await expect(page.getByLabel("建物名・部屋番号")).toHaveValue("試験ビル101号室");
  } finally {
    await deleteAuthUsersByEmail(email);
    await deleteAuthUsersByEmail(duplicateEmail);
  }
});

test("未ログインの保護ページと safe-next の回帰", async ({ page }) => {
  const user = await createGeneralUser("safenext");

  try {
    await page.goto("/me");
    await expect(page).toHaveURL(/\/login\?next=%2Fme$/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/sellers\/login\?next=%2Fdashboard$/);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin$/);

    await page.goto("/login?next=https%3A%2F%2Fevil.example%2Fsteal");
    await page.getByLabel("メールアドレス").fill(user.email);
    await page.getByLabel("パスワード").fill(user.password);
    await page.getByRole("button", { name: "ログインする" }).click();
    await expect(page).toHaveURL("/");

    await page.context().clearCookies();
    await loginGeneral(page, user, "/me");

    await page.goto(`/users/${user.id}`);
    await expect(page.getByRole("heading", { name: user.handle })).toBeVisible();
    await expect(page.getByText("地域", { exact: true })).toHaveCount(0);
    await expect(page.getByText("栽培形態", { exact: true })).toHaveCount(0);
    await expect(page.getByText("所属", { exact: true })).toHaveCount(0);
    await captureAccountScreen(page, "32-general-user-page.png");

    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "メーカーアカウントでログインしてください" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "メーカーログインへ" })).toHaveAttribute(
      "href",
      "/sellers/login",
    );

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
  } finally {
    await deleteAuthUsersByEmail(user.email);
  }
});
