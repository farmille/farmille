import { createClient, type User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { registerGeneralUserWithSupabase, type GeneralSignupInput } from "./general";
import type { Database } from "@/types/database.types";

const userId = "00000000-0000-4000-8000-000000000701";
const input: GeneralSignupInput = {
  handle: "登録テスト",
  email: "signup@example.test",
  password: "Farmille-Signup-Test-2026!",
  standpoint: "farmer",
  familyName: "山田",
  givenName: "太郎",
  phone: "",
  postalCode: "1000001",
  prefectureCode: 13,
  city: "千代田区",
  streetAddress: "千代田1-1",
  buildingName: "",
  terms: "on",
};
function authUser(): User {
  return {
    id: userId,
    aud: "authenticated",
    email: input.email,
    email_confirmed_at: "2026-10-11T00:00:00Z",
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-10-11T00:00:00Z",
  };
}
function client(responses: Response[]) {
  const requests: Request[] = [];
  const admin = createClient<Database>("https://example.supabase.co", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false, storageKey: crypto.randomUUID() },
    global: {
      fetch: async (resource, init) => {
        const request = new Request(resource, init);
        requests.push(request);
        const response = responses.shift();
        if (!response) throw new Error(`想定外のリクエスト：${request.url}`);
        return response;
      },
    },
  });
  return { admin, requests };
}
const saved = () => new Response(null, { status: 201 });
const deleted = () => new Response(null, { status: 204 });
const dbError = (code: string) => Response.json({ code, message: "保存失敗" }, { status: 409 });

describe("メール確認後の一般登録", () => {
  it.each(["general", "seller", "admin"])("既存の%s会員を変更しない", async (accountType) => {
    const user = { ...authUser(), app_metadata: { account_type: accountType } };
    const { admin, requests } = client([Response.json(user)]);
    expect(await registerGeneralUserWithSupabase(input, admin, userId)).toEqual({
      ok: false,
      error: "email_unavailable",
    });
    expect(requests).toHaveLength(1);
  });
  it("未確認メールと差し替えたメールは保存しない", async () => {
    for (const user of [
      { ...authUser(), email_confirmed_at: undefined },
      { ...authUser(), email: "other@example.test" },
    ]) {
      const { admin, requests } = client([Response.json(user)]);
      expect(await registerGeneralUserWithSupabase(input, admin, userId)).toEqual({
        ok: false,
        error: "expired_link",
      });
      expect(requests).toHaveLength(1);
    }
  });
  it("確認済み本人の連絡先とパスワードを保存し、ログインはしない", async () => {
    const { admin, requests } = client([
      Response.json(authUser()),
      Response.json([]),
      saved(),
      saved(),
      Response.json(authUser()),
    ]);
    expect(await registerGeneralUserWithSupabase(input, admin, userId)).toEqual({
      ok: true,
      data: { userId, signedIn: false },
    });
    expect(requests.map((request) => `${request.method} ${new URL(request.url).pathname}`)).toEqual(
      [
        `GET /auth/v1/admin/users/${userId}`,
        "GET /rest/v1/profiles",
        "POST /rest/v1/profiles",
        "POST /rest/v1/profile_contact_details",
        `PUT /auth/v1/admin/users/${userId}`,
      ],
    );
    expect(await requests[3].json()).toMatchObject({ user_id: userId, postal_code: "1000001" });
    expect(await requests[4].json()).toMatchObject({ app_metadata: { account_type: "general" } });
  });
  it("同時送信の敗者は既存プロフィールを削除しない", async () => {
    const { admin, requests } = client([
      Response.json(authUser()),
      Response.json([]),
      dbError("23505"),
    ]);
    expect(await registerGeneralUserWithSupabase(input, admin, userId)).toEqual({
      ok: false,
      error: "handle_taken",
    });
    expect(requests.some((request) => request.method === "DELETE")).toBe(false);
  });
  it("連絡先保存が失敗したらプロフィールと通知だけを取り消す", async () => {
    const { admin, requests } = client([
      Response.json(authUser()),
      Response.json([]),
      saved(),
      dbError("23514"),
      deleted(),
      deleted(),
    ]);
    expect(await registerGeneralUserWithSupabase(input, admin, userId)).toEqual({
      ok: false,
      error: "internal",
    });
    expect(
      requests
        .filter((request) => request.method === "DELETE")
        .map((request) => new URL(request.url).pathname),
    ).toEqual(["/rest/v1/registration_notifications", "/rest/v1/profiles"]);
    expect(requests.some((request) => request.method === "PUT")).toBe(false);
  });
  it("パスワード保存が失敗したら再試行できる状態へ戻す", async () => {
    const error = Response.json(
      { code: "weak_password", msg: "弱いパスワード" },
      { status: 422, headers: { "x-supabase-api-version": "2024-01-01" } },
    );
    const { admin, requests } = client([
      Response.json(authUser()),
      Response.json([]),
      saved(),
      saved(),
      error,
      deleted(),
      deleted(),
    ]);
    expect(await registerGeneralUserWithSupabase(input, admin, userId)).toEqual({
      ok: false,
      error: "weak_password",
    });
    expect(requests.filter((request) => request.method === "DELETE")).toHaveLength(2);
  });
});
