import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/auth/roles";
import type { User } from "@supabase/supabase-js";

// 同一リクエスト内で memoize（React 19 cache）。Server Component / Server Action /
// Route Handler 共通で動作。1 リクエスト中に getUser / getRole / getSession を
// 重複呼び出ししても Supabase Auth Server への HTTP は 1 往復に集約される。
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

// user を引数で受け取れるオプショナル形。省略時は getUser を呼ぶ
// （memoize 経由で再 fetch しない）。既存呼び出し `await getRole()` は無変更で動く。
export async function getRole(user?: User | null): Promise<Role | null> {
  const u = user !== undefined ? user : await getUser();
  if (!u) return null;
  return (u.app_metadata?.role ?? null) as Role | null;
}

export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
});
