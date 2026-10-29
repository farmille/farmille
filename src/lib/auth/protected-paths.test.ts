import { describe, expect, it } from "vitest";

import { decideAuthRedirect, isProtectedPath } from "./protected-paths";

describe("isProtectedPath", () => {
  it("要ログインの画面を保護対象と判定する", () => {
    expect(isProtectedPath("/me")).toBe(true);
    expect(isProtectedPath("/me/saved/compare")).toBe(true);
    expect(isProtectedPath("/post")).toBe(true);
    expect(isProtectedPath("/dashboard/articles/new")).toBe(true);
    expect(isProtectedPath("/admin/sellers")).toBe(true);
  });

  it("退会の完了画面は、要ログインの配下でもログインなしで開ける", () => {
    expect(isProtectedPath("/account/withdrawn")).toBe(false);
    expect(isProtectedPath("/account/withdraw")).toBe(true);
    expect(isProtectedPath("/account/details")).toBe(true);
  });
  it("前方一致だけの別 path を保護対象に含めない", () => {
    expect(isProtectedPath("/members")).toBe(false);
    expect(isProtectedPath("/posts")).toBe(false);
    expect(isProtectedPath("/dashboards")).toBe(false);

    {
      expect(isProtectedPath("/")).toBe(false);
      expect(isProtectedPath("/search")).toBe(false);
      expect(isProtectedPath("/materials/abc-123")).toBe(false);
      expect(isProtectedPath("/reports/abc-123")).toBe(false);
      expect(isProtectedPath("/sellers/xyz")).toBe(false);
      expect(isProtectedPath("/users/xyz")).toBe(false);
    }
  });
});

describe("decideAuthRedirect", () => {
  it("未ログインの保護パスは ?next= 付きでログインへ送る", () => {
    expect(decideAuthRedirect("/me", "/me", false)).toBe("/login?next=%2Fme");
    expect(decideAuthRedirect("/post", "/post?material=abc", false)).toBe(
      "/login?next=%2Fpost%3Fmaterial%3Dabc",
    );
    expect(decideAuthRedirect("/dashboard", "/dashboard", false)).toBe(
      "/sellers/login?next=%2Fdashboard",
    );

    expect(decideAuthRedirect("/dashboard/materials/abc", "/dashboard/materials/abc", false)).toBe(
      "/sellers/login?next=%2Fdashboard%2Fmaterials%2Fabc",
    );
  });

  it("ログイン済みでログイン・登録画面を開いたらホームへ送る", () => {
    expect(decideAuthRedirect("/login", "/login?next=%2Fme", true)).toBe("/");
    expect(decideAuthRedirect("/signup", "/signup", true)).toBe("/");
    expect(decideAuthRedirect("/signup/general", "/signup/general", true)).toBe("/");

    {
      expect(decideAuthRedirect("/signup/done", "/signup/done", true)).toBeNull();
    }
  });

  it("公開ページはどちらの状態でも素通し", () => {
    expect(decideAuthRedirect("/", "/", false)).toBeNull();
    expect(decideAuthRedirect("/materials/abc", "/materials/abc", true)).toBeNull();
  });

  it("ログイン済みの保護パスは素通し（ロール判定は server 側）", () => {
    expect(decideAuthRedirect("/me", "/me", true)).toBeNull();
    expect(decideAuthRedirect("/admin/reports", "/admin/reports", true)).toBeNull();
  });
});
