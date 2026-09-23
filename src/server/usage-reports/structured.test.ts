import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => vi.unstubAllEnvs());

import { reportMediaUrl } from "./structured";

describe("レポート写真の保存先", () => {
  it("投稿者の保存パスを正規のStorageへ解決し、別ホストや別投稿者への逸脱を拒否する", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://storage.example.test");
    const author = "11111111-1111-4111-8111-111111111111";
    const path = `/storage/v1/object/public/report-media/${author}/photo.png`;
    expect(reportMediaUrl(`https://untrusted.example.test${path}`, author)).toBe(
      `https://storage.example.test${path}`,
    );
    expect(() =>
      reportMediaUrl("https://example.test//untrusted.example.test/a.png", author),
    ).toThrow();
    expect(() =>
      reportMediaUrl(
        "https://example.test/storage/v1/object/public/report-media/another-user/photo.png",
        author,
      ),
    ).toThrow();
  });
});
