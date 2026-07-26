import { cache } from "react";

import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";

// 01 §4: 一般ユーザー / 出品者 / 運営。JWT の app_metadata.account_type が正。
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toAccountType(value: unknown): AccountType | null {
  return ACCOUNT_TYPES.find((accountType) => accountType === value) ?? null;
}

function toAal(value: unknown): AuthenticatorAssuranceLevel | null {
  if (value === "aal1" || value === "aal2") return value;
  return null;
}

/**
 * アクセストークン（JWT）の claims を SessionUser に変換する。
 * 想定外の形の claim は補完せず null にして、判定側で弾けるようにする。
 */
export function toSessionUser(claims: unknown): SessionUser | null {
  if (!isRecord(claims)) return null;

  const userId = claims.sub;
  if (typeof userId !== "string" || userId.length === 0) return null;

  const appMetadata = isRecord(claims.app_metadata) ? claims.app_metadata : null;
  const sellerId = appMetadata?.seller_id;

  return {
    userId,
    accountType: toAccountType(appMetadata?.account_type),
    sellerId: typeof sellerId === "string" && sellerId.length > 0 ? sellerId : null,
    aal: toAal(claims.aal),
  };
}

export function authorizeGeneralUser(user: SessionUser | null): Result<GeneralSession> {
  if (user === null) return fail("unauthorized");
  if (user.accountType !== "general") return fail("forbidden");

  return succeed({ userId: user.userId });
}

export function authorizeSeller(user: SessionUser | null): Result<SellerSession> {
  if (user === null) return fail("unauthorized");
  if (user.accountType !== "seller") return fail("forbidden");
  // seller_id が無い JWT は出品者として扱わない（承認処理の取りこぼし検知）。
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
  return authorizeGeneralUser(await getSessionUser());
}

export async function requireSeller(): Promise<Result<SellerSession>> {
  return authorizeSeller(await getSessionUser());
}

export async function requireAdmin(): Promise<Result<AdminSession>> {
  return authorizeAdmin(await getSessionUser());
}
