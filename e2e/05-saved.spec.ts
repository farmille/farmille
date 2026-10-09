import { expect, test } from "@playwright/test";

import {
  createGeneralUser,
  createMaterial,
  deleteAuthUsersByEmail,
  deleteMaterial,
  seedCatalogMaterial,
} from "./support/test-data";
import { loginGeneral } from "./support/ui";

test("お気に入り保存、マイページ一覧、比較表", async ({ page }) => {
  const user = await createGeneralUser("saved");
  const materials = await Promise.all([createMaterial("saved-a"), createMaterial("saved-b")]);

  try {
    await seedCatalogMaterial(materials[0].id);
    await loginGeneral(page, user);

    for (const material of materials) {
      await page.goto(`/materials/${material.id}`);
      await page.getByRole("button", { name: "お気に入りに追加" }).click();
      await expect(page.getByRole("button", { name: "お気に入りから解除" })).toBeVisible();
    }

    await page.goto("/me/saved");
    for (const material of materials) {
      const materialLink = page.getByRole("link", { name: new RegExp(material.name) });
      await expect(materialLink).toBeVisible();
      await materialLink.locator("..").getByRole("checkbox", { name: "比較に含める" }).check();
    }

    await expect(page.locator('img[src*="container-shapes"]')).toBeVisible();
    await page.getByRole("button", { name: "比較する" }).click();
    await expect(page).toHaveURL(/\/me\/saved\/compare\?/);
    await expect(page.getByRole("table")).toBeVisible();
    for (const material of materials) {
      await expect(page.getByText(material.name, { exact: true })).toBeVisible();
    }
    await page.goto(`/materials/${materials[0].id}/report/new`);
    await expect(page.locator('img[src*="container-shapes"]')).toBeVisible();
  } finally {
    await deleteAuthUsersByEmail(user.email);
    for (const material of materials) {
      await deleteMaterial(material.id);
    }
  }
});
