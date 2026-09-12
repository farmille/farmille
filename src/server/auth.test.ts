import { describe, expect, it } from "vitest";
import type { JwtPayload } from "@supabase/supabase-js";

import {
  authorizeAdmin,
  authorizeGeneralUser,
  authorizeSeller,
  toSessionUser,
  type SessionUser,
} from "@/server/auth";

// Supabase のアクセストークン（JWT）の payload を模したもの。
function claims(overrides: Partial<JwtPayload> = {}): JwtPayload {
  return {
    iss: "http://127.0.0.1:54321/auth/v1",
    sub: "11111111-1111-1111-1111-111111111111",
    aud: "authenticated",
    exp: 1_900_000_000,
    iat: 1_899_996_400,
    role: "authenticated",
    aal: "aal1",
    session_id: "22222222-2222-2222-2222-222222222222",
    email: "farmer@example.com",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    ...overrides,
  };
}

const SELLER_ID = "33333333-3333-3333-3333-333333333333";

describe("toSessionUser", () => {
  it("app_metadata から account_type と seller_id を取り出す", () => {
    const user = toSessionUser(
      claims({ app_metadata: { account_type: "seller", seller_id: SELLER_ID } }),
    );

    expect(user).toEqual({
      userId: "11111111-1111-1111-1111-111111111111",
      accountType: "seller",
      sellerId: SELLER_ID,
      aal: "aal1",
    });
  });

  it("MFA 済みトークンの aal2 を保持する", () => {
    expect(
      toSessionUser(claims({ aal: "aal2", app_metadata: { account_type: "admin" } }))?.aal,
    ).toBe("aal2");
  });

  it("account_type 未設定（オンボーディング前）は null にする", () => {
    const user = toSessionUser(claims());

    expect(user?.accountType).toBeNull();
    expect(user?.sellerId).toBeNull();
  });

  it("未知の account_type は補完せず null にする", () => {
    const user = toSessionUser(
      claims({ app_metadata: { account_type: "superadmin", seller_id: "" } }),
    );

    expect(user?.accountType).toBeNull();
    expect(user?.aal).toBe("aal1");
    expect(user?.sellerId).toBeNull();
  });
});

function sessionUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    userId: "11111111-1111-1111-1111-111111111111",
    accountType: "general",
    sellerId: null,
    aal: "aal1",
    ...overrides,
  };
}

describe("authorizeGeneralUser", () => {
  it.each(["aal1", "aal2"] as const)("運営は %s でも本人として一般機能を利用できる", (aal) => {
    expect(authorizeGeneralUser(sessionUser({ accountType: "admin", aal }))).toEqual({
      ok: true,
      data: { userId: "11111111-1111-1111-1111-111111111111" },
    });
  });
  it("account_type='general' を通す", () => {
    expect(authorizeGeneralUser(sessionUser())).toEqual({
      ok: true,
      data: { userId: "11111111-1111-1111-1111-111111111111" },
    });
  });

  it("未ログインは unauthorized・他ロールは forbidden", () => {
    expect(authorizeGeneralUser(null)).toEqual({ ok: false, error: "unauthorized" });
    expect(
      authorizeGeneralUser(sessionUser({ accountType: "seller", sellerId: SELLER_ID })),
    ).toEqual({ ok: false, error: "forbidden" });
    expect(authorizeGeneralUser(sessionUser({ accountType: null }))).toEqual({
      ok: false,
      error: "forbidden",
    });
  });
});

describe("authorizeSeller", () => {
  it("seller_id 付きの seller を通し、seller_id を返す", () => {
    expect(authorizeSeller(sessionUser({ accountType: "seller", sellerId: SELLER_ID }))).toEqual({
      ok: true,
      data: { userId: "11111111-1111-1111-1111-111111111111", sellerId: SELLER_ID },
    });
  });

  it("seller_id の無い seller トークンは forbidden", () => {
    expect(authorizeSeller(sessionUser({ accountType: "seller" }))).toEqual({
      ok: false,
      error: "forbidden",
    });
  });

  it("未ログインは unauthorized・一般ユーザーは forbidden", () => {
    expect(authorizeSeller(null)).toEqual({ ok: false, error: "unauthorized" });
    expect(authorizeSeller(sessionUser())).toEqual({ ok: false, error: "forbidden" });
  });
});

describe("authorizeAdmin", () => {
  it("admin かつ aal2 のときだけ通す", () => {
    expect(authorizeAdmin(sessionUser({ accountType: "admin", aal: "aal2" }))).toEqual({
      ok: true,
      data: { userId: "11111111-1111-1111-1111-111111111111" },
    });
  });

  it("admin だが aal1／aal 不明は aal2_required", () => {
    expect(authorizeAdmin(sessionUser({ accountType: "admin", aal: "aal1" }))).toEqual({
      ok: false,
      error: "aal2_required",
    });
    expect(authorizeAdmin(sessionUser({ accountType: "admin", aal: null }))).toEqual({
      ok: false,
      error: "aal2_required",
    });
  });

  it("admin 以外は aal2 でも forbidden・未ログインは unauthorized", () => {
    expect(authorizeAdmin(sessionUser({ accountType: "general", aal: "aal2" }))).toEqual({
      ok: false,
      error: "forbidden",
    });
    expect(
      authorizeAdmin(sessionUser({ accountType: "seller", sellerId: SELLER_ID, aal: "aal2" })),
    ).toEqual({ ok: false, error: "forbidden" });
    expect(authorizeAdmin(null)).toEqual({ ok: false, error: "unauthorized" });
  });
});
