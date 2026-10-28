import { afterEach, describe, expect, it, vi } from "vitest";

import { shrinkAvatar, shrinkAvatarIn, shrunkAvatarSize } from "./shrink-avatar";

describe("アイコン画像の縮小", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("長辺を1600pxに収め、小さい画像は拡大しない", () => {
    expect(shrunkAvatarSize(3024, 4032)).toEqual({ width: 1200, height: 1600 });
    expect(shrunkAvatarSize(4032, 3024)).toEqual({ width: 1600, height: 1200 });
    expect(shrunkAvatarSize(400, 300)).toEqual({ width: 400, height: 300 });
  });

  it("ブラウザが読めない画像はそのまま送る", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn().mockRejectedValue(new Error("decode")));
    const file = new File(["x"], "IMG_0001.HEIC", { type: "image/heic" });
    await expect(shrinkAvatar(file)).resolves.toBe(file);
  });

  it("上限内の小さな画像は形式を変えずにそのまま送る", async () => {
    const close = vi.fn();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ width: 400, height: 400, close }),
    );
    const file = new File(["x"], "icon.png", { type: "image/png" });
    await expect(shrinkAvatar(file)).resolves.toBe(file);
    expect(close).toHaveBeenCalled();
  });

  it("画像を選んでいなければフォームを変えない", async () => {
    const empty = new File([], "");
    const formData = new FormData();
    formData.set("avatar", empty);
    await shrinkAvatarIn(formData);
    expect(formData.get("avatar")).toStrictEqual(empty);
  });
});
