import { expect, test } from "@playwright/test";
import { registrationMail, registrationLink } from "./support/registration-mail";
import { signupGeneral, loginGeneral } from "./support/ui";
import { deleteAuthUsersByEmail, uniqueToken } from "./support/test-data";

test("メール確認、登録完了、ログインと所属の入力", async ({ page, browser }) => {
  const token = uniqueToken("registration");
  const email = `${token}@example.test`;
  const handle = `E2E_${token}`.slice(0, 30);
  const password = "Farmille-E2E-Signup-2026!";
  try {
    await page.goto("/signup/complete");
    await expect(page).toHaveURL(/\/signup\/general\?error=expired_link/);
    await expect(page.getByText(/認証リンクの有効期限/)).toBeVisible();
    await page.goto("/signup");
    await expect(page.getByRole("link", { name: /登録済みの方はログイン/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "メーカーの方はこちら" })).toHaveAttribute(
      "href",
      "/sellers/apply",
    );
    await expect(page.getByLabel("ニックネーム")).toHaveCount(0);
    await page.getByLabel("メールアドレス").fill("invalid");
    await page.getByRole("button", { name: "認証メールを送信" }).click();
    await expect(page.getByLabel("メールアドレス")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("入力の形式が正しくありません。", { exact: true })).toBeVisible();
    await page.getByLabel("メールアドレス").fill(email);
    await page.getByRole("button", { name: "認証メールを送信" }).click();
    await expect(page.getByText("メールをご確認ください", { exact: true })).toBeVisible();
    const first = await registrationMail(
      email,
      "【Farmille】メールアドレスの確認（会員登録はまだ完了していません）",
    );
    await expect(page.getByLabel("メールアドレス")).toHaveValue(email);
    // ローカルAuthの再送間隔（1秒）を超えてから、別のリンクを発行する。
    await page.waitForTimeout(1100);
    await page.getByRole("button", { name: "認証メールを再送" }).click();
    const second = await registrationMail(
      email,
      "【Farmille】メールアドレスの確認（会員登録はまだ完了していません）",
      first.id,
    );
    const link = registrationLink(second.Text);
    await page.goto(registrationLink(first.Text));
    await expect(page).toHaveURL(/error=expired_link/);
    const expired = new URL(link);
    expired.searchParams.set("token_hash", "invalid-registration-token");
    await page.goto(expired.toString());
    await expect(page).toHaveURL(/error=expired_link/);
    await expect(page.getByLabel("ニックネーム")).toHaveCount(0);
    // 別のブラウザでも、メール内リンクだけで登録を継続できる。
    const other = await browser.newContext({
      viewport: page.viewportSize() ?? { width: 375, height: 812 },
    });
    const otherPage = await other.newPage();
    const withoutFlag = new URL(link);
    withoutFlag.searchParams.delete("registration");
    await otherPage.goto(withoutFlag.toString());
    await expect(otherPage).toHaveURL(/\/signup\/complete/);
    await expect(otherPage.getByLabel("メールアドレス")).toHaveValue(email);
    await expect(otherPage.getByLabel("メールアドレス")).toHaveAttribute("readonly");
    expect((await other.cookies()).some((cookie) => cookie.name.startsWith("sb-"))).toBe(false);
    await otherPage.goto("/me");
    await expect(otherPage).toHaveURL(/\/login\?next=%2Fme/);
    await other.close();
    await page.goto(link);
    await expect(page).toHaveURL(/error=expired_link/);
    await signupGeneral(page, { handle, email, password });
    await expect(page).toHaveURL(/\/signup\/done$/);
    const welcome = await registrationMail(email, "【Farmille】会員登録が完了しました");
    expect(welcome.From.Address).toBe("noreply@example.test");
    expect(welcome.Text).toContain("http://localhost:3007/login");
    await page.goto("/me");
    await expect(page).toHaveURL(/\/login\?next=%2Fme/);
    await loginGeneral(page, { email, password, id: "", handle }, "/me");
    await page.getByRole("link", { name: "表示情報を編集" }).click();
    const affiliation = page.getByRole("combobox", { name: "所属", exact: true });
    await affiliation.click();
    await expect(page.getByRole("option")).toHaveCount(0);
    await affiliation.pressSequentially("JA");
    await expect(page.getByRole("option").first()).toBeVisible();
    const selectedName = await page.getByRole("option").first().innerText();
    await page.getByRole("option").first().click();
    await expect(affiliation).toHaveValue("");
    await affiliation.pressSequentially("JA");
    await expect(page.getByRole("option", { name: selectedName, exact: true })).toHaveCount(0);
    await affiliation.clear();
    await expect(page.getByRole("option")).toHaveCount(0);
    await page.getByRole("button", { name: "保存する", exact: true }).click();
    await expect(page).toHaveURL(/\/me$/);
    await expect(page.getByText(selectedName, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "ログアウト" }).click();
    await loginGeneral(page, { email, password, id: "", handle }, "/me");
    await expect(page.getByText(handle, { exact: true })).toBeVisible();
  } finally {
    await deleteAuthUsersByEmail(email);
  }
});
