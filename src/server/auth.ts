import { cache } from "react";
import { redirect } from "next/navigation";
import type { JwtPayload } from "@supabase/supabase-js";
import * as v from "valibot";

import { fail, succeed, type Result } from "@/server/result";
import { createAdminSupabase, createServerSupabase } from "@/server/supabase";
import { canUseGeneralFeatures } from "@/lib/auth/capabilities";

// 01 §4：一般ユーザー／メーカー／運営。JWT の app_metadata.account_type が正。
export const ACCOUNT_TYPES = ["general", "seller", "admin"] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export type AuthenticatorAssuranceLevel = "aal1" | "aal2";

export type SessionUser = {
  userId: string;
  accountType: AccountType | null;
  /** account_type='seller' のときだけ入る。権限判定は必ずこの値で行う（01 §4）。 */
  sellerId: string | null;
  aal: AuthenticatorAssuranceLevel | null;
};

export type GeneralSession = {
  userId: string;
};

export type SellerSession = {
  userId: string;
  sellerId: string;
};

export type AdminSession = {
  userId: string;
};

const SessionClaimsSchema = v.object({
  sub: v.pipe(v.string(), v.minLength(1)),
  aal: v.string(),
  app_metadata: v.optional(
    v.object({
      account_type: v.optional(v.string()),
      seller_id: v.optional(v.string()),
    }),
  ),
});
const AccountTypeSchema = v.picklist(ACCOUNT_TYPES);
const AssuranceLevelSchema = v.picklist(["aal1", "aal2"]);

/**
 * アクセストークン（JWT）の claims を SessionUser に変換する。
 * 想定外の形の claim は補完せず null にして、判定側で弾けるようにする。
 */
export function toSessionUser(claims: JwtPayload): SessionUser | null {
  const claimsResult = v.safeParse(SessionClaimsSchema, claims);
  if (!claimsResult.success) return null;

  const accountTypeResult = v.safeParse(
    AccountTypeSchema,
    claimsResult.output.app_metadata?.account_type,
  );
  const assuranceLevelResult = v.safeParse(AssuranceLevelSchema, claimsResult.output.aal);
  const sellerId = claimsResult.output.app_metadata?.seller_id?.trim() ?? "";

  return {
    userId: claimsResult.output.sub,
    accountType: accountTypeResult.success ? accountTypeResult.output : null,
    sellerId: sellerId.length > 0 ? sellerId : null,
    aal: assuranceLevelResult.success ? assuranceLevelResult.output : null,
  };
}

export function authorizeGeneralUser(user: SessionUser | null): Result<GeneralSession> {
  if (user === null) return fail("unauthorized");
  if (!canUseGeneralFeatures(user.accountType)) return fail("forbidden");

  return succeed({ userId: user.userId });
}

export function authorizeSeller(user: SessionUser | null): Result<SellerSession> {
  if (user === null) return fail("unauthorized");
  if (user.accountType !== "seller") return fail("forbidden");
  // seller_id が無い JWT はメーカーとして扱わない（承認処理の取りこぼし検知）。
  if (user.sellerId === null) return fail("forbidden");

  return succeed({ userId: user.userId, sellerId: user.sellerId });
}

/** admin は account_type='admin' かつ AAL2（MFA 済み）を要求する（01 §4）。 */
export function authorizeAdmin(user: SessionUser | null): Result<AdminSession> {
  if (user === null) return fail("unauthorized");
  if (user.accountType !== "admin") return fail("forbidden");
  if (user.aal !== "aal2") return fail("aal2_required");

  return succeed({ userId: user.userId });
}

/**
 * 現在のリクエストのログインユーザー。1リクエスト内で memoize する。
 * getClaims() は JWT を検証したうえで claims を返す（対称鍵の場合は Auth サーバー照会）。
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getClaims();

  // 未ログイン（data も error も無い）と、期限切れ・改竄トークン（AuthError）は
  // どちらも「ログインしていない」として扱う。それ以外の例外は握り潰さず伝播する。
  if (error !== null || data === null) return null;

  return toSessionUser(data.claims);
});

export async function getAccountType(): Promise<AccountType | null> {
  const user = await getSessionUser();

  return user?.accountType ?? null;
}

export async function requireGeneralUser(): Promise<Result<GeneralSession>> {
  const user = await getSessionUser();
  const result = authorizeGeneralUser(user);
  if (!result.ok || user?.accountType !== "admin") return result;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", result.data.userId)
    .maybeSingle();
  if (error !== null) {
    console.error("個人プロフィールの確認に失敗しました", error);
    return fail("internal");
  }
  if (data === null) redirect("/me/setup");
  return result;
}

export async function requireSeller(): Promise<Result<SellerSession>> {
  const session = authorizeSeller(await getSessionUser());
  if (!session.ok) return session;

  // 非公開のauth_user_idも照合し、発行済みJWTからの凍結・紐づけ変更の迂回を防ぐ。
  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from("seller_accounts")
    .select("status")
    .eq("id", session.data.sellerId)
    .eq("auth_user_id", session.data.userId)
    .maybeSingle();
  if (error !== null) {
    console.error("メーカーアカウントの確認に失敗しました", error);
    return fail("internal");
  }
  if (data?.status !== "approved") return fail("forbidden");

  return session;
}

export async function requireAdmin(): Promise<Result<AdminSession>> {
  return authorizeAdmin(await getSessionUser());
}
