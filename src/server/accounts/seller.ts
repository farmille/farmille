import type { SupabaseClient } from "@supabase/supabase-js";

import { EMAIL_PATTERN } from "@/lib/auth/account-rules";
import { isRegionScope } from "@/lib/region-scopes";
import { trimmedFormDataString } from "@/lib/validation";
import { toErrorCode } from "@/server/accounts/auth-errors";
import { fail, succeed, type Result } from "@/server/result";
import { createAdminSupabase, createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

/** メーカーの共有ログインに使う合成メールのドメイン（01 §4）。クライアントには出さない。 */
export const SELLER_EMAIL_DOMAIN = "sellers.farmille.internal";

// seller_accounts.login_id の CHECK 制約（migration 20260726121216）と同じ形。
export const LOGIN_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{2,30}$/;

const OFFICIAL_NAME_MAX = 100;
const CONTACT_NAME_MAX = 80;
const LOCATION_MAX = 200;
const WEBSITE_URL_MAX = 500;
const INVITE_CODE_MAX = 64;

export type SellerSignInResult = {
  sellerId: string;
};

export type SellerApplyInput = {
  officialName: string;
  loginId: string;
  contactEmail: string;
  contactName: string;
  location: string;
  regionScope: string;
  websiteUrl: string | null;
  inviteCode: string | null;
};

export type SellerApplyFieldErrors = Partial<
  Record<
    | "officialName"
    | "loginId"
    | "contactEmail"
    | "contactName"
    | "location"
    | "regionScope"
    | "websiteUrl"
    | "inviteCode",
    string
  >
>;

export type SellerApplyValidation =
  | { ok: true; input: SellerApplyInput }
  | { ok: false; fieldErrors: SellerApplyFieldErrors };

export type SellerApplyResult = {
  /** INSERT 成功。anon は applied 行を SELECT できないため id は返さない。 */
  applied: true;
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

/** 公式サイト URL。空は任意として null、入力ありは http(s) のみ許可。 */
function normalizeWebsiteUrl(raw: string): { ok: true; value: string | null } | { ok: false } {
  if (raw.length === 0) return { ok: true, value: null };
  if (raw.length > WEBSITE_URL_MAX) return { ok: false };

  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return { ok: false };

    return { ok: true, value: url.toString() };
  } catch {
    return { ok: false };
  }
}

/**
 * メーカー申請フォームの入力検証（パスワードは扱わない。承認時に発行＝T-44）。
 */
export function validateSellerApply(raw: {
  officialName: FormDataEntryValue | null;
  loginId: FormDataEntryValue | null;
  contactEmail: FormDataEntryValue | null;
  contactName: FormDataEntryValue | null;
  location: FormDataEntryValue | null;
  regionScope: FormDataEntryValue | null;
  websiteUrl: FormDataEntryValue | null;
  inviteCode: FormDataEntryValue | null;
}): SellerApplyValidation {
  const fieldErrors: SellerApplyFieldErrors = {};

  const officialName = trimmedFormDataString(raw.officialName);
  if (officialName.length === 0) {
    fieldErrors.officialName = "正式名称を入力してください。";
  } else if (officialName.length > OFFICIAL_NAME_MAX) {
    fieldErrors.officialName = `正式名称は${OFFICIAL_NAME_MAX}文字以内で入力してください。`;
  }

  const loginId = trimmedFormDataString(raw.loginId).toLowerCase();
  if (loginId.length === 0) {
    fieldErrors.loginId = "ログイン ID を入力してください。";
  } else if (!LOGIN_ID_PATTERN.test(loginId)) {
    fieldErrors.loginId =
      "ログイン ID は半角英小文字・数字と . _ - のみ、3〜31文字で入力してください。";
  }

  const contactEmail = trimmedFormDataString(raw.contactEmail);
  if (contactEmail.length === 0) {
    fieldErrors.contactEmail = "連絡先メールアドレスを入力してください。";
  } else if (!EMAIL_PATTERN.test(contactEmail)) {
    fieldErrors.contactEmail = "メールアドレスの形式が正しくありません。";
  }

  const contactName = trimmedFormDataString(raw.contactName);
  if (contactName.length === 0) {
    fieldErrors.contactName = "ご担当者名を入力してください。";
  } else if (contactName.length > CONTACT_NAME_MAX) {
    fieldErrors.contactName = `ご担当者名は${CONTACT_NAME_MAX}文字以内で入力してください。`;
  }

  const location = trimmedFormDataString(raw.location);
  if (location.length === 0) {
    fieldErrors.location = "所在地を入力してください。";
  } else if (location.length > LOCATION_MAX) {
    fieldErrors.location = `所在地は${LOCATION_MAX}文字以内で入力してください。`;
  }

  const regionScope = trimmedFormDataString(raw.regionScope);
  if (!isRegionScope(regionScope)) {
    fieldErrors.regionScope = "主な地域を選択してください。";
  }

  const websiteRaw = trimmedFormDataString(raw.websiteUrl);
  const websiteUrl = normalizeWebsiteUrl(websiteRaw);
  if (!websiteUrl.ok) {
    fieldErrors.websiteUrl = "公式サイト URL は https:// から始まる形式で入力してください。";
  }

  const inviteRaw = trimmedFormDataString(raw.inviteCode);
  if (inviteRaw.length > INVITE_CODE_MAX) {
    fieldErrors.inviteCode = `招待コードは${INVITE_CODE_MAX}文字以内で入力してください。`;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    input: {
      officialName,
      loginId,
      contactEmail,
      contactName,
      location,
      regionScope,
      websiteUrl: websiteUrl.ok ? websiteUrl.value : null,
      inviteCode: inviteRaw.length === 0 ? null : inviteRaw,
    },
  };
}

async function isLoginIdTaken(
  admin: SupabaseClient<Database>,
  loginId: string,
): Promise<Result<boolean>> {
  // applied / rejected も含めて UNIQUE。anon の SELECT は approved のみなので admin で確認する。
  const { data, error } = await admin
    .from("seller_accounts")
    .select("id")
    .eq("login_id", loginId)
    .maybeSingle();

  if (error !== null) {
    console.error(`[seller-apply] login_id の重複確認に失敗: ${error.code} ${error.message}`);

    return fail("internal");
  }

  return succeed(data !== null);
}

/**
 * 招待コードが既存行に載っているか確認する。
 * invite_code は anon に SELECT 権限がないため admin 経由。
 */
async function resolveInviteCode(
  admin: SupabaseClient<Database>,
  inviteCode: string,
): Promise<Result<string>> {
  const { data, error } = await admin
    .from("seller_accounts")
    .select("invite_code")
    .eq("invite_code", inviteCode)
    .limit(1)
    .maybeSingle();

  if (error !== null) {
    console.error(`[seller-apply] 招待コードの照合に失敗: ${error.code} ${error.message}`);

    return fail("internal");
  }

  if (data === null || data.invite_code === null) {
    return fail("invalid_invite_code");
  }

  return succeed(data.invite_code);
}

/**
 * メーカー申請（02 §2 `/sellers/apply`）。
 * Auth ユーザーは作らない。status=applied で INSERT し、承認は T-44。
 */
export async function applySellerAccount(
  input: SellerApplyInput,
): Promise<Result<SellerApplyResult>> {
  const admin = createAdminSupabase();

  const taken = await isLoginIdTaken(admin, input.loginId);
  if (!taken.ok) return taken;
  if (taken.data) return fail("login_id_taken");

  let inviteCode: string | null = null;
  if (input.inviteCode !== null) {
    const resolved = await resolveInviteCode(admin, input.inviteCode);
    if (!resolved.ok) return resolved;
    inviteCode = resolved.data;
  }

  // anon INSERT の RLS（status=applied・auth_user_id/approved_at NULL）を実効経路として使う。
  // applied 行は SELECT できないため RETURNING（.select）は付けない。
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("seller_accounts").insert({
    official_name: input.officialName,
    login_id: input.loginId,
    contact_email: input.contactEmail,
    contact_name: input.contactName,
    location: input.location,
    region_scope: input.regionScope,
    website_url: input.websiteUrl,
    invite_code: inviteCode,
    status: "applied",
    auth_user_id: null,
    approved_at: null,
  });

  if (error !== null) {
    // 競合時の UNIQUE 違反をフィールドエラーへ寄せる。
    if (error.code === "23505") return fail("login_id_taken");

    console.error(`[seller-apply] INSERT に失敗: ${error.code} ${error.message}`);

    return fail("internal");
  }

  return succeed({ applied: true });
}

/**
 * メーカーログイン（02 §2 `/sellers/login`）。
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
