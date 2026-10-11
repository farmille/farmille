import { createClient, type User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import {
  registerGeneralUserWithSupabase,
  type GeneralSignupInput,
} from "@/server/accounts/general";
import type { Database } from "@/types/database.types";

const createdUserId = "00000000-0000-4000-8000-000000000701";
const existingUserId = "00000000-0000-4000-8000-000000000702";
const emailRedirectTo = "https://farmille.example/auth/confirm?next=%2Fme";
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

function authUser(id = createdUserId): User {
  return {
    id,
    aud: "authenticated",
    email: input.email,
    app_metadata: { account_type: "general", provider: "email", providers: ["email"] },
    user_metadata: {},
    identities: [{ id, user_id: id, identity_id: id, provider: "email" }],
    created_at: "2026-10-11T00:00:00.000Z",
  };
}

function sessionResponse(id = createdUserId): Response {
  return Response.json({
    user: { ...authUser(id), email_confirmed_at: "2026-10-11T00:00:01.000Z" },
    access_token: "test-access-token",
    refresh_token: "test-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
  });
}

function authError(code: string, status: number): Response {
  return Response.json(
    { code, msg: code },
    { status, headers: { "x-supabase-api-version": "2024-01-01" } },
  );
}

function supabaseClients(fetch: typeof globalThis.fetch) {
  function client() {
    return createClient<Database>("https://example.supabase.co", "test-key", {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: crypto.randomUUID(),
      },
      global: { fetch },
    });
  }
  return { admin: client(), supabase: client() };
}

function registrationClients(responses: Response[]) {
  const requests: Request[] = [];
  const clients = supabaseClients(async (resource, init) => {
    const request = new Request(resource, init);
    requests.push(request);
    const response = responses.shift();
    if (response === undefined) throw new Error(`想定外のリクエスト：${request.url}`);
    return response;
  });
  return { ...clients, requests };
}

function registrationResponses() {
  return [
    Response.json([]),
    Response.json(authUser()),
    new Response(null, { status: 201 }),
    new Response(null, { status: 201 }),
  ];
}

function requestPaths(requests: Request[]) {
  return requests.map((request) => `${request.method} ${new URL(request.url).pathname}`);
}

describe("registerGeneralUser", () => {
  it("未確認の既存メールを拒否し、既存ユーザーの更新・削除やプロフィール作成を行わない", async () => {
    const requests: Request[] = [];
    let existingUser: User | null = authUser(existingUserId);
    let existingProfile = true;
    const { admin, supabase } = supabaseClients(async (resource, init) => {
      const request = new Request(resource, init);
      requests.push(request);
      const path = new URL(request.url).pathname;
      if (path === "/rest/v1/profiles" && request.method === "GET") return Response.json([]);
      if (path === "/auth/v1/admin/users") return authError("email_exists", 422);
      // GoTrueは未確認メールへのsignUpに実ユーザーを返し、createUserでは重複を拒否する。
      if (path === "/auth/v1/signup") return Response.json(existingUser);
      if (path === "/rest/v1/profiles")
        return Response.json({ code: "23505", message: "duplicate user_id" }, { status: 409 });
      if (path === `/auth/v1/admin/users/${existingUserId}`) {
        if (request.method === "DELETE") {
          existingUser = null;
          existingProfile = false;
          return Response.json({});
        }
        return Response.json(existingUser);
      }
      throw new Error(`想定外のリクエスト：${request.url}`);
    });
    const result = await registerGeneralUserWithSupabase(input, admin, supabase, emailRedirectTo);

    expect(existingUser).toEqual(authUser(existingUserId));
    expect(existingProfile).toBe(true);
    expect(result).toEqual({
      ok: false,
      error: "email_unavailable",
    });
    expect(requestPaths(requests)).toEqual(["GET /rest/v1/profiles", "POST /auth/v1/admin/users"]);
  });

  it("ハンドルが使用済みならAuthユーザーを作成しない", async () => {
    const { admin, supabase, requests } = registrationClients([
      Response.json([{ user_id: existingUserId }]),
    ]);
    expect(await registerGeneralUserWithSupabase(input, admin, supabase, emailRedirectTo)).toEqual({
      ok: false,
      error: "handle_taken",
    });
    expect(requestPaths(requests)).toEqual(["GET /rest/v1/profiles"]);
  });

  it.each([true, false])(
    "メール確認の有効状態が%sのとき、登録情報を保存してから設定に従う認証結果を返す",
    async (confirmationsEnabled) => {
      const { admin, supabase, requests } = registrationClients([
        ...registrationResponses(),
        confirmationsEnabled ? Response.json(authUser()) : sessionResponse(),
      ]);
      expect(
        await registerGeneralUserWithSupabase(input, admin, supabase, emailRedirectTo),
      ).toEqual({
        ok: true,
        data: { userId: createdUserId, signedIn: !confirmationsEnabled },
      });
      expect(requestPaths(requests)).toEqual([
        "GET /rest/v1/profiles",
        "POST /auth/v1/admin/users",
        "POST /rest/v1/profiles",
        "POST /rest/v1/profile_contact_details",
        "POST /auth/v1/signup",
      ]);
      expect(await requests[1].text()).toBe(
        JSON.stringify({
          email: input.email,
          password: input.password,
          email_confirm: false,
          app_metadata: { account_type: "general" },
        }),
      );
      expect(await requests[2].text()).toContain(`"user_id":"${createdUserId}"`);
      expect(await requests[3].text()).toContain(`"user_id":"${createdUserId}"`);
      expect(new URL(requests[4].url).searchParams.get("redirect_to")).toBe(emailRedirectTo);
      expect(await supabase.auth.getSession()).toMatchObject({
        data: {
          session: confirmationsEnabled
            ? null
            : { user: { id: createdUserId, app_metadata: { account_type: "general" } } },
        },
        error: null,
      });
    },
  );

  it.each([
    { code: "23505", expectedError: "handle_taken" },
    { code: "23514", expectedError: "internal" },
  ])(
    "プロフィール保存が$codeで失敗したら新規ユーザーだけを削除する",
    async ({ code, expectedError }) => {
      const { admin, supabase, requests } = registrationClients([
        Response.json([]),
        Response.json(authUser()),
        Response.json(
          { code, message: "profile rejected" },
          { status: code === "23505" ? 409 : 400 },
        ),
        Response.json({}),
      ]);
      expect(
        await registerGeneralUserWithSupabase(input, admin, supabase, emailRedirectTo),
      ).toEqual({
        ok: false,
        error: expectedError,
      });
      expect(requestPaths(requests)).toEqual([
        "GET /rest/v1/profiles",
        "POST /auth/v1/admin/users",
        "POST /rest/v1/profiles",
        `DELETE /auth/v1/admin/users/${createdUserId}`,
      ]);
    },
  );

  it("非公開連絡先の保存に失敗したら新規ユーザーだけを削除し、確認メールを送らない", async () => {
    const { admin, supabase, requests } = registrationClients([
      Response.json([]),
      Response.json(authUser()),
      new Response(null, { status: 201 }),
      Response.json({ code: "23514", message: "contact rejected" }, { status: 400 }),
      Response.json({}),
    ]);
    expect(await registerGeneralUserWithSupabase(input, admin, supabase, emailRedirectTo)).toEqual({
      ok: false,
      error: "internal",
    });
    expect(requestPaths(requests)).toEqual([
      "GET /rest/v1/profiles",
      "POST /auth/v1/admin/users",
      "POST /rest/v1/profiles",
      "POST /rest/v1/profile_contact_details",
      `DELETE /auth/v1/admin/users/${createdUserId}`,
    ]);
  });

  it("確認メールの送信が拒否されたら新規ユーザーだけを削除し、登録失敗を返す", async () => {
    const { admin, supabase, requests } = registrationClients([
      ...registrationResponses(),
      authError("over_email_send_rate_limit", 429),
      Response.json({}),
    ]);
    expect(await registerGeneralUserWithSupabase(input, admin, supabase, emailRedirectTo)).toEqual({
      ok: false,
      error: "rate_limited",
    });
    expect(requestPaths(requests).slice(-2)).toEqual([
      "POST /auth/v1/signup",
      `DELETE /auth/v1/admin/users/${createdUserId}`,
    ]);
  });

  it("認証結果のIDが違っても既存ユーザーを削除せず、新規ユーザーだけを削除する", async () => {
    const { admin, supabase, requests } = registrationClients([
      ...registrationResponses(),
      Response.json(authUser(existingUserId)),
      Response.json({}),
    ]);
    expect(await registerGeneralUserWithSupabase(input, admin, supabase, emailRedirectTo)).toEqual({
      ok: false,
      error: "internal",
    });
    expect(requestPaths(requests).slice(-2)).toEqual([
      "POST /auth/v1/signup",
      `DELETE /auth/v1/admin/users/${createdUserId}`,
    ]);
  });

  it("認証結果のIDが違うセッションを残さず、そのセッションだけをログアウトする", async () => {
    const { admin, supabase, requests } = registrationClients([
      ...registrationResponses(),
      sessionResponse(existingUserId),
      new Response(null, { status: 204 }),
      Response.json({}),
    ]);
    expect(await registerGeneralUserWithSupabase(input, admin, supabase, emailRedirectTo)).toEqual({
      ok: false,
      error: "internal",
    });
    expect(requestPaths(requests).slice(-3)).toEqual([
      "POST /auth/v1/signup",
      "POST /auth/v1/logout",
      `DELETE /auth/v1/admin/users/${createdUserId}`,
    ]);
    expect(new URL(requests[5].url).searchParams.get("scope")).toBe("local");
    expect(await supabase.auth.getSession()).toEqual({ data: { session: null }, error: null });
  });
});
