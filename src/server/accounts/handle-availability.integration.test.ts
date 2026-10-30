import { createClient } from "@supabase/supabase-js";
import * as v from "valibot";
import { describe, expect, it } from "vitest";

import { serverEnv } from "@/env";
import type { Database } from "@/types/database.types";

import { isHandleTakenByOthersWithSupabase } from "./handle-availability";

const localUrl = process.env.SUPABASE_LOCAL_URL;

if (localUrl !== undefined && localUrl !== "http://127.0.0.1:54321")
  throw new Error("統合テストは専用ローカルDBで実行してください。");

const ProfileRowSchema = v.object({ user_id: v.string(), handle: v.string() });

describe.skipIf(localUrl === undefined)("ニックネームの使用状況", () => {
  it("保存時と同じく前後の空白を除いて完全一致で比べ、本人の今のニックネームは使われているとみなさない", async () => {
    if (!localUrl) throw new Error("SUPABASE_LOCAL_URLがありません。");

    const admin = createClient<Database>(localUrl, serverEnv.supabaseSecretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const existing = await admin
      .from("profiles")
      .select("user_id, handle")
      .not("handle", "is", null)
      .limit(1)
      .single();

    if (existing.error) throw existing.error;
    const { user_id: owner, handle } = v.parse(ProfileRowSchema, existing.data);

    expect(await isHandleTakenByOthersWithSupabase(admin, handle, null)).toEqual({
      ok: true,
      data: true,
    });
    expect(await isHandleTakenByOthersWithSupabase(admin, ` ${handle}　`, null)).toEqual({
      ok: true,
      data: true,
    });
    expect(await isHandleTakenByOthersWithSupabase(admin, handle, owner)).toEqual({
      ok: true,
      data: false,
    });
    expect(
      await isHandleTakenByOthersWithSupabase(
        admin,
        `unused_${crypto.randomUUID().slice(0, 12)}`,
        null,
      ),
    ).toEqual({ ok: true, data: false });
    expect(await isHandleTakenByOthersWithSupabase(admin, "　 ", null)).toEqual({
      ok: false,
      error: "invalid_body",
    });
  });
});
