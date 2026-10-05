import type { Browser } from "@e2e-dev/web";
import { credentials, expect, type App, type Screen } from "e2e";
import { TOTP } from "otpauth";
import { createGeneralUser, deleteAuthUser, getMaterial } from "../../e2e/support/test-data";
import { promoteAdmin } from "../../e2e/support/account-flows";

/** Publish only the owned fixture through the existing AAL2 admin UI to refresh REST seeds. */
export async function refreshCatalogThroughAdmin(
  app: App,
  screen: Screen,
  browser: Browser,
  materialId: string,
): Promise<void> {
  const material = await getMaterial(materialId);
  if (!material.name.startsWith("E2E資材_e2e-army-")) {
    throw new Error("Catalog preparation may only update owned Tester Army material fixtures.");
  }
  const admin = await createGeneralUser("army-search-admin");
  const detailPath = `/admin/materials/${materialId}`;
  try {
    await promoteAdmin(admin);
    await app.clearState();
    await app.open(`/login?next=${encodeURIComponent(detailPath)}`);
    await screen.getByLabel("メールアドレス", { exact: false }).fill(admin.email);
    await screen
      .getByLabel("パスワード", { exact: false })
      .fill(credentials.user("general").password);
    await screen.getByRole("button", "ログインする").tap();
    await expect(browser).toHaveURL(/\/admin\/mfa\?/);
    await screen.getByRole("button", "登録を始める").tap();
    const key = screen.getByText(/^[A-Z2-7]+$/, { exact: true });
    await expect(key).toBeVisible();
    const secret = await key.textContent();
    if (!secret) throw new Error("The admin MFA screen did not expose its enrollment key.");
    const code = new TOTP({ algorithm: "SHA1", digits: 6, period: 30, secret }).generate();
    await screen.getByLabel("認証コード", { exact: false }).fill(code);
    await screen.getByRole("button", "登録を完了する").tap();
    await expect(browser).toHaveURL(detailPath);
    await screen.getByRole("combobox", /^公開状態\s*必須$/).selectOption({ value: "published" });
    await screen.getByRole("button", "公開状態を更新").tap();
    await expect(
      screen.getByRole("alert").filter({ hasText: "資材を公開状態へ戻しました。" }),
    ).toBeVisible();
  } finally {
    await app.clearState();
    await deleteAuthUser(admin.id);
  }
}
