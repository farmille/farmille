import { expect, type Locator, type Page } from "@playwright/test";
import { captureScreenFlow } from "./screen-flow";
import { TOTP } from "otpauth";

import type { E2eAdminAccount } from "./admin-accounts";
import type { GeneralUser, SellerAccount } from "./test-data";

const COLD_NAVIGATION_TIMEOUT_MS = 30_000;

/** SSR直後の未hydration要素をクリックせず、Reactが操作を処理できる状態を待つ。 */
async function waitForReactHydration(locator: Locator): Promise<void> {
  await expect
    .poll(
      async () =>
        locator.evaluate((element) =>
          Object.keys(element).some((key) => key.startsWith("__reactProps$")),
        ),
      { timeout: COLD_NAVIGATION_TIMEOUT_MS },
    )
    .toBe(true);
}

export async function signupGeneral(
  page: Page,
  input: { handle: string; email: string; password: string },
): Promise<void> {
  await page.goto("/signup/general");
  await page.getByLabel("ハンドルネーム").fill(input.handle);
  await page.getByLabel("メールアドレス").fill(input.email);
  await page.getByLabel("パスワード").fill(input.password);
  await page.getByRole("radio", { name: "農家", exact: true }).check();
  const submitButton = page.getByRole("button", { name: "登録する" });
  await waitForReactHydration(submitButton);
  await submitButton.click();
}

export async function loginGeneral(page: Page, user: GeneralUser, next = "/"): Promise<void> {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("メールアドレス").fill(user.email);
  await page.getByLabel("パスワード").fill(user.password);
  const submitButton = page.getByRole("button", { name: "ログインする" });
  await waitForReactHydration(submitButton);
  await submitButton.click();
  const expectedPathname = new URL(next, "http://127.0.0.1:3007").pathname;
  await expect(page).toHaveURL((url) => url.pathname === expectedPathname, {
    timeout: COLD_NAVIGATION_TIMEOUT_MS,
  });
}

export async function loginSeller(page: Page, seller: SellerAccount): Promise<void> {
  await page.goto("/sellers/login");
  await page.getByLabel("ログインID").fill(seller.loginId);
  await page.getByLabel("パスワード").fill(seller.password);
  const submitButton = page.getByRole("button", { name: "ログインする" });
  await waitForReactHydration(submitButton);
  await submitButton.click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: COLD_NAVIGATION_TIMEOUT_MS });
}

export async function loginAdminAndEnrollMfa(
  page: Page,
  admin: E2eAdminAccount,
  next: string,
): Promise<void> {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("メールアドレス").fill(admin.email);
  await page.getByLabel("パスワード").fill(admin.password);
  const loginButton = page.getByRole("button", { name: "ログインする" });
  await waitForReactHydration(loginButton);
  await loginButton.click();
  await expect(page).toHaveURL(/\/admin\/mfa\?/, { timeout: COLD_NAVIGATION_TIMEOUT_MS });

  const enrollmentButton = page.getByRole("button", { name: "登録を始める" });
  if (process.env.CAPTURE_SCREEN_FLOW === "1") {
    await captureScreenFlow(page, "60-admin-mfa.png");
  }
  await waitForReactHydration(enrollmentButton);
  await enrollmentButton.click();
  const secretLocator = page
    .locator("span")
    .filter({ hasText: /^[A-Z2-7]+$/ })
    .first();
  const secret = (await secretLocator.textContent())?.trim();

  if (secret === undefined || secret.length === 0) {
    throw new Error("TOTP 登録用シークレットを画面から取得できませんでした。");
  }

  const code = new TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  }).generate();

  await page.getByLabel("認証コード").fill(code);
  const verificationButton = page.getByRole("button", { name: "登録を完了する" });
  await waitForReactHydration(verificationButton);
  await verificationButton.click();
  const expectedPathname = new URL(next, "http://127.0.0.1:3007").pathname;
  await expect(page).toHaveURL((url) => url.pathname === expectedPathname, {
    timeout: COLD_NAVIGATION_TIMEOUT_MS,
  });
}

export async function fillUsageReportForSubmission(page: Page): Promise<void> {
  await page.getByLabel("使用後に観察した変化").fill("E2Eで観察した変化を具体的に記録しました。");
  await page.getByRole("button", { name: "樹勢改善", exact: true }).click();
  await page.getByLabel("地域").selectOption("13");
  await page.getByRole("button", { name: "露地栽培", exact: true }).click();
  await page.getByRole("button", { name: "栄養生長期", exact: true }).click();

  const applicationCalendar = page.getByLabel("処理日のカレンダー");
  await applicationCalendar.getByRole("button", { name: "1", exact: true }).click();
  await page.getByRole("button", { name: "葉・茎・果実に散布", exact: true }).click();
  await page.getByPlaceholder("例：1000").fill("1000");
  await page.getByLabel("全体をまとめてひとこと").fill("E2Eで入力した使用レポートのまとめです。");
  await page
    .getByRole("button", {
      name: /この使用結果には、病害虫の防除、殺菌・殺虫、農薬の代替/,
    })
    .click();
}
