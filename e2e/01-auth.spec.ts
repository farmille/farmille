import { expect, test } from "@playwright/test";

import { createGeneralUser, deleteAuthUsersByEmail, uniqueToken } from "./support/test-data";
import { loginGeneral, signupGeneral } from "./support/ui";

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
    await expect(page.getByRole("link", { name: "メーカー・出品者申請へ" })).toHaveAttribute(
      "href",
      "/sellers/apply",
    );

    await signupGeneral(page, { handle, email, password });
    await expect(page).toHaveURL(/\/signup\/done$/);
    await expect(page.getByRole("heading", { name: "登録が完了しました" })).toBeVisible();

    await page.goto("/me");
    await expect(page.getByText(handle, { exact: true })).toBeVisible();
    const sellerApplyLink = page.getByRole("link", {
      name: "メーカー・出品者アカウントを申請",
    });
    await expect(sellerApplyLink).toHaveAttribute("href", "/sellers/apply?from=me");
    await sellerApplyLink.click();
    await expect(page).toHaveURL(/\/sellers\/apply\?from=me$/);
    const backLink = page.getByRole("link", { name: "戻る" });
    await expect(backLink).toHaveAttribute("href", "/me");
    await backLink.click();
    await expect(page).toHaveURL(/\/me$/);
    await page.getByRole("button", { name: "ログアウト" }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/login");
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

    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "出品者アカウントでログインしてください" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "出品者ログインへ" })).toHaveAttribute(
      "href",
      "/sellers/login",
    );

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
  } finally {
    await deleteAuthUsersByEmail(user.email);
  }
});
