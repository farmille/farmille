import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/auth/roles";
import type { User } from "@supabase/supabase-js";

// 同一リクエスト内で memoize（React 19 cache）。Server Component / Server Action /
// Route Handler 共通で動作。getUser は Supabase Auth Server に問い合わせて JWT
// 署名検証する（getSession の cookie cache では検証されない）。access_token が
// 必要な箇所では呼び出し側で別途 supabase.auth.getSession() を呼ぶ。
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
