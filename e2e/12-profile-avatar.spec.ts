import { readFileSync } from "node:fs";
import { crc32 } from "node:zlib";
import { expect, test } from "@playwright/test";

import { createGeneralUser, deleteAuthUser, deleteAvatars } from "./support/test-data";
import { loginGeneral } from "./support/ui";

// PNGのメタデータで容量を揃え、画像としても読み込める境界値を作る。
function avatarPng(bytes: number): Buffer {
  const png = readFileSync(new URL("./fixtures/report.png", import.meta.url));
  const chunk = Buffer.alloc(bytes - png.length, " ");
  chunk.writeUInt32BE(chunk.length - 12, 0);
  chunk.write("tEXt", 4);
  chunk.write("size\0", 8);
  chunk.writeUInt32BE(crc32(chunk.subarray(4, -4)), chunk.length - 4);
  return Buffer.concat([png.subarray(0, -12), chunk, png.subarray(-12)]);
}

for (const sizeMb of [1.5, 2]) {
  test(`${sizeMb}MBのアイコン画像と自己紹介を保存して再表示できる`, async ({ page }, testInfo) => {
    const user = await createGeneralUser("avatar");
    const bio = `${sizeMb}MBのアイコン画像と一緒に保存した自己紹介`;

    try {
      await loginGeneral(page, user, "/me/edit");
      await page.getByLabel("自己紹介").fill(bio);
      await page.getByLabel("アバター").setInputFiles({
        name: "avatar.png",
        mimeType: "image/png",
        buffer: avatarPng(sizeMb * 1024 * 1024),
      });
      await page.getByRole("button", { name: "保存する", exact: true }).click();
      await expect(page).toHaveURL(/\/me\?saved=profile$/);
      await page.goto("/me/edit");
      await expect(page.getByLabel("自己紹介")).toHaveValue(bio);
      const avatar = page.locator(`main img[src*="/avatars/${user.id}/"]`);
      await expect(avatar).toBeVisible();
      await expect(avatar).toHaveJSProperty("naturalWidth", 400);
      await page.screenshot({
        path: testInfo.outputPath("profile-avatar-saved.png"),
        fullPage: true,
      });
    } finally {
      await deleteAvatars(user.id);
      await deleteAuthUser(user.id);
    }
  });
}

test("2MBを超えるアイコン画像ではプロフィールを保存しない", async ({ page }) => {
  const user = await createGeneralUser("avatar-limit");

  try {
    await loginGeneral(page, user, "/me/edit");
    await page.getByLabel("自己紹介").fill("保存されない自己紹介");
    await page.getByLabel("アバター").setInputFiles({
      name: "oversized-avatar.png",
      mimeType: "image/png",
      buffer: avatarPng(2 * 1024 * 1024 + 1),
    });
    await page.getByRole("button", { name: "保存する", exact: true }).click();
    await expect(
      page.getByText("アバター画像は2MB以下のJPEG / PNG / WebPでアップロードしてください。"),
    ).toBeVisible();
    await page.goto(`/users/${user.id}`);
    await expect(page.getByRole("heading", { name: user.handle })).toBeVisible();
    await expect(page.getByText("保存されない自己紹介")).toHaveCount(0);
    await expect(page.locator(`main img[src*="/avatars/${user.id}/"]`)).toHaveCount(0);
  } finally {
    await deleteAvatars(user.id);
    await deleteAuthUser(user.id);
  }
});
