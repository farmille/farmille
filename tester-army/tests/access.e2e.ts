import { test } from "@e2e-dev/web";
import { credentials, expect } from "e2e";
import { sellerTest } from "../support/fixtures";

for (const path of [
  "/dashboard",
  "/dashboard/applications",
  "/dashboard/profile",
  "/dashboard/articles",
]) {
  test(`匿名では${path}をメーカーのログインへ案内する`, async ({ app, browser }) => {
    await app.open(path);
    await expect(browser).toHaveURL(`/sellers/login?next=${encodeURIComponent(path)}`);
  });
}

for (const path of [
  "/admin",
  "/admin/company-applications",
  "/admin/materials/requests",
  "/admin/tags",
]) {
  test(`匿名では${path}を運営のログインへ案内する`, async ({ app, browser }) => {
    await app.open(path);
    await expect(browser).toHaveURL(`/login?next=${encodeURIComponent(path)}`);
  });
}

sellerTest("旧メーカー新規登録URLから資材一覧へ戻る", async ({ app, screen, browser, seller }) => {
  await app.open("/sellers/login");
  await screen.getByLabel("ログインID", { exact: false }).fill(seller.loginId);
  await screen.getByLabel("パスワード", { exact: false }).fill(credentials.user("seller").password);
  await screen.getByRole("button", "ログインする").tap();
  await expect(browser).toHaveURL("/dashboard");
  await app.open("/dashboard/materials/new");
  await expect(browser).toHaveURL("/dashboard/materials");
  await expect(screen.getByRole("main")).toBeVisible();
});
