import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { clientEnv, serverEnv } from "@/env";
import { registerGeneralUserWithSupabase, type GeneralSignupInput } from "./general";
import type { Database } from "@/types/database.types";

const localUrl = process.env.SUPABASE_LOCAL_URL;
if (localUrl !== undefined && localUrl !== "http://127.0.0.1:54321")
  throw new Error("統合テストは専用ローカルDBで実行してください。");

describe.skipIf(localUrl === undefined)("確認済みメールからの登録", () => {
  it("登録の重複を拒否し、本人情報を維持する", async () => {
    if (!localUrl) throw new Error("SUPABASE_LOCAL_URLがありません。");
    const admin = createClient<Database>(localUrl, serverEnv.supabaseSecretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const handle = `signup_${crypto.randomUUID().slice(0, 12)}`;
    const input: GeneralSignupInput = {
      handle,
      email: `${handle}@example.test`,
      password: "Farmille-Test-2026!",
      standpoint: "farmer",
      familyName: "試験",
      givenName: "太郎",
      phone: "",
      postalCode: "1000001",
      prefectureCode: 13,
      cityStreet: "千代田区1-1",
      buildingName: "",
      terms: "on",
    };
    const created = await admin.auth.admin.createUser({ email: input.email, email_confirm: true });
    if (created.error || !created.data.user)
      throw created.error ?? new Error("ユーザーを作成できません。");
    const id = created.data.user.id;
    try {
      expect(await registerGeneralUserWithSupabase(input, admin, id)).toEqual({
        ok: true,
        data: { userId: id, signedIn: false },
      });
      expect(
        await registerGeneralUserWithSupabase({ ...input, handle: "変更後" }, admin, id),
      ).toEqual({ ok: false, error: "email_unavailable" });
      const profile = await admin.from("profiles").select("handle").eq("user_id", id).single();
      expect(profile.data?.handle).toBe(handle);
      const session = createClient<Database>(localUrl, clientEnv.supabasePublishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const login = await session.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      expect(login.error).toBeNull();
      expect(login.data.user?.id).toBe(id);
    } finally {
      const deleted = await admin.auth.admin.deleteUser(id);
      expect(deleted.error).toBeNull();
    }
  }, 30_000);
});
