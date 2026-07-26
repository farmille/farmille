import { toErrorCode } from "@/server/accounts/auth-errors";
import { fail, succeed, type Result } from "@/server/result";
import { createAdminSupabase, createServerSupabase } from "@/server/supabase";

/** 出品者の共有ログインに使う合成メールのドメイン（01 §4）。クライアントには出さない。 */
export const SELLER_EMAIL_DOMAIN = "sellers.farmille.internal";

// seller_accounts.login_id の CHECK 制約（migration 20260726121216）と同じ形。
const LOGIN_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{2,30}$/;

export type SellerSignInResult = {
  sellerId: string;
};

/**
 * ログイン ID を合成メールへ解決する。形が違えば null（=認証させない）。
 * 大文字は小文字に寄せる（login_id は小文字のみ許可されているため）。
 */
export function syntheticSellerEmail(loginId: string): string | null {
  const normalized = loginId.trim().toLowerCase();

  if (!LOGIN_ID_PATTERN.test(normalized)) return null;

  return `${normalized}@${SELLER_EMAIL_DOMAIN}`;
}

/**
 * 出品者ログイン（02 §2 `/sellers/login`）。
 * ログイン ID → seller_accounts（approved かつ共有ログイン発行済み）→ 合成メールで認証。
 * どの段階で落ちても同じエラーコードを返し、ID とパスワードのどちらが誤りかを推測させない。
 */
export async function signInSellerWithLoginId(
  loginId: string,
  password: string,
): Promise<Result<SellerSignInResult>> {
  const email = syntheticSellerEmail(loginId);
  if (email === null || password.length === 0) return fail("seller_invalid_credentials");

  const admin = createAdminSupabase();
  const { data: seller, error: sellerError } = await admin
    .from("seller_accounts")
    .select("id, status, auth_user_id")
    .eq("login_id", loginId.trim().toLowerCase())
    .maybeSingle();

  if (sellerError !== null) {
    console.error(
      `[auth] seller_accounts の参照に失敗: ${sellerError.code} ${sellerError.message}`,
    );

    return fail("internal");
  }

  // 未申請・審査中・却下・凍結、共有ログイン未発行はすべて同じ扱いにする。
  if (seller === null || seller.status !== "approved" || seller.auth_user_id === null) {
    return fail("seller_invalid_credentials");
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error !== null) {
    const code = toErrorCode(error, "sellerSignIn");

    return fail(code === "invalid_credentials" ? "seller_invalid_credentials" : code);
  }

  // 承認時に発行した auth ユーザー以外では通さない（login_id の付け替え事故の検知）。
  if (data.user.id !== seller.auth_user_id) {
    await supabase.auth.signOut();
    console.error(
      `[auth] seller_accounts と auth ユーザーの対応が一致しません seller=${seller.id}`,
    );

    return fail("seller_invalid_credentials");
  }

  return succeed({ sellerId: seller.id });
}
