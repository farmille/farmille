import { expect, test, type Page } from "@playwright/test";
import { captureScreenFlow } from "./support/screen-flow";
import { registrationLink, registrationMail } from "./support/registration-mail";
import { createGeneralUser, deleteAuthUsersByEmail, uniqueToken } from "./support/test-data";
import { loginGeneral, signupGeneral } from "./support/ui";

async function captureAccountScreen(page: Page, filename: string): Promise<void> {
  if (process.env.CAPTURE_ACCOUNT_FLOW === "1") await captureScreenFlow(page, filename);
}

test("メール確認、登録完了、ログインと所属の入力", async ({ page, browser }) => {
  const token = uniqueToken("registration");
  const email = `${token}@example.test`;
  const handle = `E2E_${token}`.slice(0, 30);
  const password = "Farmille-E2E-Signup-2026!";
  const existing = await createGeneralUser("duplicate-handle");
  try {
    await page.goto("/signup/complete");
    await expect(page).toHaveURL(/\/signup\/general\?error=expired_link/);
    await expect(page.getByText(/この認証リンクは、使用済みか/)).toBeVisible();
    await page.goto("/signup");
    await captureAccountScreen(page, "02-general-signup.png");
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
    // 登録情報の入力中に同じリンクを開き直しても、使用済みの案内ではなく入力へ戻る
    await otherPage.goto(withoutFlag.toString());
    await expect(otherPage).toHaveURL(/\/signup\/complete/);
    await expect(otherPage.getByLabel("メールアドレス")).toHaveValue(email);
    await otherPage.goto("/me");
    await expect(otherPage).toHaveURL(/\/login\?next=%2Fme/);
    await other.close();
    await signupGeneral(page, { handle: existing.handle, email, password });
    await expect(page.getByLabel("ニックネーム")).toHaveAccessibleDescription(
      /このニックネームはすでに使われています。別のニックネームを入力してください。/,
    );
    await expect(page.getByLabel("市区町村・番地")).toHaveValue("千代田区千代田1-1");
    await expect(page.getByLabel("建物名・部屋番号")).toHaveValue("試験ビル101号室");
    await page.getByLabel("ニックネーム").fill(handle);
    await page.getByLabel("パスワード", { exact: true }).fill(password);
    await page.getByRole("button", { name: "登録する" }).click();
    await expect(page).toHaveURL(/\/signup\/done$/);
    await captureAccountScreen(page, "07-general-signup-done.png");
    await registrationMail(email, "【Farmille】会員登録が完了しました");
    await page.goto("/me");
    await expect(page).toHaveURL(/\/login\?next=%2Fme/);
    await loginGeneral(page, { email, password, id: "", handle }, "/me");
    await page.getByRole("button", { name: "チュートリアルを終了" }).click();
    await captureAccountScreen(page, "09-mypage.png");
    await page.getByRole("link", { name: "プロフィール公開情報を編集" }).click();
    const affiliation = page.getByRole("combobox", { name: "所属", exact: true });
    await affiliation.pressSequentially("JA");
    await expect(page.getByRole("option").first()).toBeVisible();
    const selectedName = await page.getByRole("option").first().innerText();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: "保存する", exact: true }).click();
    await expect(page).toHaveURL(/\/me\?saved=profile$/);
    await expect(page.getByText(selectedName, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "ログアウト" }).click();
    await expect(page).toHaveURL("/");
    await captureAccountScreen(page, "08-home.png");
    await page.goto("/login?next=https%3A%2F%2Fevil.example%2Fsteal");
    await captureAccountScreen(page, "06-general-login.png");
    await page.getByLabel("メールアドレス").fill(email);
    await page.getByLabel("パスワード").fill(password);
    await page.getByRole("button", { name: "ログインする" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Farmilleへようこそ" })).toHaveCount(0);
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Farmille企業会員IDでログインしてください" }),
    ).toBeVisible();
    await page.goto("/me");
    await expect(page.getByRole("heading", { name: handle })).toBeVisible();
  } finally {
    await deleteAuthUsersByEmail(email);
    await deleteAuthUsersByEmail(existing.email);
  }
});
