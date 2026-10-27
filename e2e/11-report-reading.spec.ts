import { expect, test } from "@playwright/test";
import {
  createGeneralUser,
  createMaterial,
  createPublishedUsageReport,
  deleteAuthUsersByEmail,
  deleteMaterial,
} from "./support/test-data";

test("レポートの全文はログイン後に表示し、ログアウト後は返さない", async ({ page }) => {
  const user = await createGeneralUser("reading");
  const material = await createMaterial("reading");
  const privateText = "会員限定の観察結果末尾です";
  try {
    const report = await createPublishedUsageReport({
      materialId: material.id,
      authorUserId: user.id,
      title: "会員向けレポートの閲覧",
      observedChange: "公開する冒頭の観察記録です。".repeat(20) + privateText,
    });
    const path = `/reports/${report.id}`;
    await page.goto(path);
    await expect(page.getByRole("link", { name: "無料会員登録して続きを読む" })).toHaveAttribute(
      "href",
      `/signup/general?next=${encodeURIComponent(path)}`,
    );
    expect(await page.content()).not.toContain(privateText);
    await page.getByRole("link", { name: "ログインはこちら" }).click();
    await page.getByLabel("メールアドレス", { exact: false }).fill(user.email);
    await page.getByLabel("パスワード", { exact: false }).fill(user.password);
    await page.getByRole("button", { name: "ログインする", exact: true }).click();
    await expect(page).toHaveURL(path);
    await expect(page.getByText(privateText, { exact: false })).toBeVisible();
    await expect(page.getByRole("link", { name: "無料会員登録して続きを読む" })).toHaveCount(0);
    await page.context().clearCookies();
    await page.reload();
    await expect(page.getByRole("link", { name: "無料会員登録して続きを読む" })).toBeVisible();
    expect(await page.content()).not.toContain(privateText);
  } finally {
    await deleteMaterial(material.id);
    await deleteAuthUsersByEmail(user.email);
  }
});
