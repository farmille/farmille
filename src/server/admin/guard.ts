import type { SupabaseClient } from "@supabase/supabase-js";

import { getSessionUser, requireAdmin, type AdminSession } from "@/server/auth";
import { fail, succeed, type Result } from "@/server/result";
import { createAdminSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

export type AdminContext = {
  session: AdminSession;
  /** service_role クライアント。RLS を素通りするため withAdmin の中でしか渡さない。 */
  supabase: SupabaseClient<Database>;
};

/**
 * admin（account_type='admin' かつ AAL2）を確認したうえで service_role を渡す（01 §4）。
 * admin 系の読み書きはすべてこの関数を経由させ、「requireAdmin を通す前に service_role を
 * 手に入れる」経路をコード上に作らない。
 */
export async function withAdmin<T>(
  run: (context: AdminContext) => Promise<Result<T>>,
): Promise<Result<T>> {
  const session = await requireAdmin();

  if (!session.ok) return session;

  return run({ session: session.data, supabase: createAdminSupabase() });
}

/**
 * MFA 登録前の admin を通すためのガード。role だけを見て AAL は問わない。
 * AAL2 を満たすための画面（/admin/mfa）専用で、業務操作には使わない。
 */
export async function requireAdminAccount(): Promise<Result<{ userId: string }>> {
  const user = await getSessionUser();

  if (user === null) return fail("unauthorized");

  if (user.accountType !== "admin") return fail("forbidden");

  return succeed({ userId: user.userId });
}

/** admin 系のクエリ・更新で握り潰しを避けるための共通ログ。 */
export function reportAdminError<ErrorValue>(
  scope: string,
  operation: string,
  error: ErrorValue,
): void {
  console.error(`[server/admin/${scope}] ${operation}`, error);
}

/** Postgres の一意制約違反。呼び出し側で conflict に変換する。 */
export function isUniqueViolation(error: { code?: string | null } | null): boolean {
  return error?.code === "23505";
}
