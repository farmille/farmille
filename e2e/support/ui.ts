import { registrationMail, registrationLink } from "./registration-mail";
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

export async function chooseOption(
  page: Page,
  combobox: Locator,
  optionName: string,
): Promise<void> {
  await combobox.click();
  await page.getByRole("option", { name: optionName, exact: true }).click();
}

export async function signupGeneral(
  page: Page,
  input: { handle: string; email: string; password: string },
): Promise<void> {
  await page.goto("/signup/general");
  await page.getByLabel("メールアドレス").fill(input.email);
  await page.getByRole("button", { name: "認証メールを送信" }).click();
  await expect(page.getByText("メールをご確認ください", { exact: true })).toBeVisible();
  const mail = await registrationMail(
    input.email,
    "【Farmille】メールアドレスの確認（会員登録はまだ完了していません）",
  );
  await page.goto(registrationLink(mail.Text));
  await expect(page).toHaveURL(/\/signup\/complete/);
  await expect(page.getByLabel("メールアドレス")).toHaveValue(input.email);
  await expect(page.getByLabel("メールアドレス")).toHaveAttribute("readonly");
  await expect(page.getByRole("region", { name: "利用規約・プライバシーポリシー" })).toBeVisible();
  await expect(page.getByText("非公開", { exact: true })).toHaveCount(0);
  await page.getByLabel("ニックネーム").fill(input.handle);
  await page.getByLabel("本名（姓）").fill("試験");
  await page.getByLabel("本名（名）").fill("太郎");
  await page.getByLabel("郵便番号").fill("1000001");
  await expect(page.getByLabel("郵便番号")).toHaveValue("100-0001");
  await chooseOption(page, page.getByRole("combobox", { name: /^都道府県/ }), "東京都");
  await page.getByLabel("市区町村・番地").fill("千代田区千代田1-1");
  await page.getByLabel("建物名・部屋番号").fill("試験ビル101号室");
  await page.getByRole("checkbox", { name: /利用規約/ }).check();
  await page.getByLabel("パスワード", { exact: true }).fill(input.password);
  await page.getByRole("radio", { name: "生産者", exact: true }).check();
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

export async function loginAdminWithPassword(
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
}

export async function loginAdminAndEnrollMfa(
  page: Page,
  admin: E2eAdminAccount,
  next: string,
): Promise<string> {
  await loginAdminWithPassword(page, admin, next);

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
  return secret;
}

export async function fillUsageReportForSubmission(page: Page): Promise<void> {
  await page.getByRole("checkbox", { name: "不明・なし", exact: true }).check();
  await page.getByRole("button", { name: /^使用目的：/ }).click();
  await page.getByRole("button", { name: "樹勢改善", exact: true }).click();
  await page.getByRole("button", { name: "完了", exact: true }).click();
  await chooseOption(page, page.getByRole("combobox", { name: "都道府県" }), "東京都");
  await page.getByRole("button", { name: /^施用時期：/ }).click();
  await page.getByRole("button", { name: "生育初〜中期", exact: true }).click();
  await page.getByRole("button", { name: "完了", exact: true }).click();
  await page
    .getByLabel("結果・感想", { exact: true })
    .fill("E2Eで観察した変化を具体的に記録しました。");
  await page.getByLabel("栽培環境", { exact: true }).fill("露地栽培で調査しました。");
  await page
    .getByLabel("処理日と生育状況", { exact: true })
    .fill("9月1日に定植、9月10日に施用しました。");
  await page.getByRole("checkbox", { name: "資材を使った日（処理日）を記入した" }).check();
  for (const [index, [name, description]] of [
    ["処理区", "10株。1000倍、200L/10aを1回葉面散布しました。"],
    ["無処理区", "10株。資材なし。ほかは同じ条件です。"],
  ].entries()) {
    await page.getByLabel("区の名前").nth(index).fill(name);
    await page.getByLabel("区の説明").nth(index).fill(description);
  }
  await page.getByLabel("調査項目1の名前", { exact: true }).fill("活着率");
  await page.getByRole("button", { name: /^文章で書く/ }).click();
  await page
    .getByLabel(/^区ごとの結果/)
    .fill("定植14日後の活着率は、処理区が90%で、無処理区（80%）より10ポイント高かった。");
  await page.getByRole("checkbox", { name: /資材を使った区の説明に/ }).check();
  await page.getByRole("checkbox", { name: /投稿ガイドラインを確認し/ }).check();
}
