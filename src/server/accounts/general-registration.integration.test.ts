import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { clientEnv, serverEnv } from "@/env";
import {
  registerGeneralUserWithSupabase,
  type GeneralSignupInput,
} from "@/server/accounts/general";
import type { Database } from "@/types/database.types";

const localSupabaseUrl = process.env.SUPABASE_LOCAL_URL;
if (localSupabaseUrl !== undefined && localSupabaseUrl !== "http://127.0.0.1:54321") {
  throw new Error("登録の統合テストは http://127.0.0.1:54321 の専用ローカルDBで実行してください。");
}
const emailRedirectTo = "http://127.0.0.1:3007/auth/confirm?next=%2Fme";

function localClients() {
  function client(key: string) {
    if (localSupabaseUrl === undefined)
      throw new Error("SUPABASE_LOCAL_URL が設定されていません。");
    return createClient<Database>(localSupabaseUrl, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: crypto.randomUUID(),
      },
    });
  }
  return {
    admin: client(serverEnv.supabaseSecretKey),
    supabase: client(clientEnv.supabasePublishableKey),
  };
}

function registrationInput(): GeneralSignupInput {
  const token = `security_signup_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
  return {
    handle: token,
    email: `${token}@example.test`,
    password: "Farmille-Security-Signup-2026!",
    standpoint: "farmer",
    familyName: "検証",
    givenName: "太郎",
    phone: "09012345678",
    postalCode: "1000001",
    prefectureCode: 13,
    city: "千代田区",
    streetAddress: "千代田1-1",
    buildingName: "検証棟101",
    terms: "on",
  };
}

async function deleteFixtureUser(admin: SupabaseClient<Database>, userId: string) {
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error !== null) throw error;
}

describe.skipIf(localSupabaseUrl === undefined)("一般登録とローカルAuthの統合", () => {
  it("未確認の一般会員へ再登録してもID・メタデータ・プロフィール・連絡先が変わらない", async () => {
    const { admin, supabase } = localClients();
    const input = registrationInput();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: false,
      app_metadata: { account_type: "general", registration_fixture: input.handle },
      user_metadata: { nickname: "既存の表示名" },
    });
    if (createError !== null) throw createError;
    if (created.user === null) throw new Error("検証用の未確認ユーザーを作成できませんでした。");
    const user = created.user;

    try {
      expect(user.email_confirmed_at).toBeFalsy();
      const profile = await admin
        .from("profiles")
        .insert({
          user_id: user.id,
          handle: input.handle,
          standpoint: input.standpoint,
          prefecture_code: input.prefectureCode,
        })
        .select("*")
        .single();
      if (profile.error !== null) throw profile.error;
      const contact = await admin
        .from("profile_contact_details")
        .insert({
          user_id: user.id,
          family_name: input.familyName,
          given_name: input.givenName,
          phone: input.phone,
          postal_code: input.postalCode,
          city: input.city,
          street_address: input.streetAddress,
          building_name: input.buildingName,
        })
        .select("*")
        .single();
      if (contact.error !== null) throw contact.error;

      const result = await registerGeneralUserWithSupabase(
        { ...input, handle: `${input.handle}_r`, familyName: "変更", streetAddress: "別の番地" },
        admin,
        supabase,
        emailRedirectTo,
      );
      expect(result).toEqual({ ok: false, error: "email_unavailable" });
      const [retainedUser, retainedProfile, retainedContact] = await Promise.all([
        admin.auth.admin.getUserById(user.id),
        admin.from("profiles").select("*").eq("user_id", user.id).single(),
        admin.from("profile_contact_details").select("*").eq("user_id", user.id).single(),
      ]);
      expect(retainedUser.error).toBeNull();
      expect(retainedUser.data.user?.id).toBe(user.id);
      expect(retainedUser.data.user?.app_metadata).toEqual(user.app_metadata);
      expect(retainedUser.data.user?.user_metadata).toEqual(user.user_metadata);
      expect(retainedUser.data.user?.email_confirmed_at).toBeFalsy();
      expect(retainedProfile.error).toBeNull();
      expect(retainedProfile.data).toEqual(profile.data);
      expect(retainedContact.error).toBeNull();
      expect(retainedContact.data).toEqual(contact.data);
      expect(await supabase.auth.getSession()).toEqual({ data: { session: null }, error: null });
    } finally {
      await deleteFixtureUser(admin, user.id);
    }
  }, 20_000);

  it("未確認のメーカー用Authユーザーを一般会員へ書き換えない", async () => {
    const { admin, supabase } = localClients();
    const input = registrationInput();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: false,
      app_metadata: { account_type: "seller", seller_id: crypto.randomUUID() },
    });
    if (createError !== null) throw createError;
    if (created.user === null)
      throw new Error("検証用のメーカーAuthユーザーを作成できませんでした。");
    const user = created.user;

    try {
      expect(user.email_confirmed_at).toBeFalsy();
      expect(
        await registerGeneralUserWithSupabase(input, admin, supabase, emailRedirectTo),
      ).toEqual({ ok: false, error: "email_unavailable" });
      const [retainedUser, profile, contact] = await Promise.all([
        admin.auth.admin.getUserById(user.id),
        admin.from("profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
        admin
          .from("profile_contact_details")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      expect(retainedUser.error).toBeNull();
      expect(retainedUser.data.user?.id).toBe(user.id);
      expect(retainedUser.data.user?.app_metadata).toEqual(user.app_metadata);
      expect(retainedUser.data.user?.email_confirmed_at).toBeFalsy();
      expect(profile.error).toBeNull();
      expect(profile.data).toBeNull();
      expect(contact.error).toBeNull();
      expect(contact.data).toBeNull();
    } finally {
      await deleteFixtureUser(admin, user.id);
    }
  }, 20_000);

  it("新規登録した本人のプロフィール・連絡先・一般会員の権限情報が揃う", async () => {
    const { admin, supabase } = localClients();
    const input = registrationInput();
    const result = await registerGeneralUserWithSupabase(input, admin, supabase, emailRedirectTo);
    if (!result.ok) throw new Error(`新規登録に失敗しました：${result.error}`);
    const userId = result.data.userId;

    try {
      expect(result.data.signedIn).toBe(true);
      const [user, profile, contact, session] = await Promise.all([
        admin.auth.admin.getUserById(userId),
        admin.from("profiles").select("*").eq("user_id", userId).single(),
        admin.from("profile_contact_details").select("*").eq("user_id", userId).single(),
        supabase.auth.getSession(),
      ]);
      expect(user.error).toBeNull();
      expect(user.data.user).toMatchObject({
        id: userId,
        email: input.email,
        app_metadata: { account_type: "general" },
      });
      expect(profile.error).toBeNull();
      expect(profile.data).toMatchObject({
        user_id: userId,
        handle: input.handle,
        standpoint: input.standpoint,
        prefecture_code: input.prefectureCode,
      });
      expect(contact.error).toBeNull();
      expect(contact.data).toMatchObject({
        user_id: userId,
        family_name: input.familyName,
        given_name: input.givenName,
        phone: input.phone,
        postal_code: input.postalCode,
        city: input.city,
        street_address: input.streetAddress,
        building_name: input.buildingName,
      });
      expect(session.error).toBeNull();
      expect(session.data.session?.user).toMatchObject({
        id: userId,
        app_metadata: { account_type: "general" },
      });
      const claims = await supabase.auth.getClaims();
      expect(claims.error).toBeNull();
      expect(claims.data?.claims).toMatchObject({
        sub: userId,
        app_metadata: { account_type: "general" },
      });
    } finally {
      await deleteFixtureUser(admin, userId);
    }
  }, 20_000);
});
