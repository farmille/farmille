import { getSessionUser } from "@/server/auth";
import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";

/** ログイン中の一般会員本人。メールアドレスは Auth サーバーに確かめた今の値。 */
export type MemberAccount = { userId: string; email: string };

/**
 * 登録情報と退会の画面を開ける本人を確かめる。企業会員と運営は forbidden にする。
 * JWT の検証だけでなく Auth サーバーにも問い合わせ、退会で消えたユーザーのログインを通さない。
 */
export async function getMemberAccount(): Promise<Result<MemberAccount>> {
  const session = await getSessionUser();
  if (session === null) return fail("unauthorized");
  if (session.accountType !== "general") return fail("forbidden");
  const { data, error } = await (await createServerSupabase()).auth.getUser();
  if (error !== null || data.user.id !== session.userId || data.user.email === undefined)
    return fail("unauthorized");
  return succeed({ userId: data.user.id, email: data.user.email });
}
