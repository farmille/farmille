import { expect, type Browser } from "@playwright/test";
import { promoteAdmin } from "./account-flows";
import { createGeneralUser, deleteAuthUser, getMaterial } from "./test-data";
import { loginAdminAndEnrollMfa } from "./ui";

export async function refreshCatalogThroughAdmin(
  browser: Browser,
  materialId: string,
): Promise<void> {
  const material = await getMaterial(materialId);
  if (!material.name.startsWith("E2E資材_e2e-")) {
    throw new Error("Catalog preparation may only update owned E2E material fixtures.");
  }
  const admin = await createGeneralUser("catalog-admin");
  const context = await browser.newContext({ baseURL: "http://localhost:3007" });
  try {
    await promoteAdmin(admin);
    const page = await context.newPage();
    await loginAdminAndEnrollMfa(page, admin, `/admin/materials/${materialId}`);
    await page.getByRole("combobox", { name: /^公開状態\s*必須$/ }).selectOption("published");
    await page.getByRole("button", { name: "公開状態を更新", exact: true }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "資材を公開状態へ戻しました。" }),
    ).toBeVisible();
  } finally {
    await context.close();
    await deleteAuthUser(admin.id);
  }
}
