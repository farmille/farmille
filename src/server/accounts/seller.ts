import type { SupabaseClient } from "@supabase/supabase-js";

import { randomUUID } from "node:crypto";
import * as v from "valibot";
import { manufacturerRegistrationSchema } from "@/lib/auth/registration-schema";
import { toErrorCode } from "@/server/accounts/auth-errors";
import { fail, succeed, type Result } from "@/server/result";
import { createAdminSupabase, createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

/** メーカーの共有ログインに使う合成メールのドメイン（01 §4）。クライアントには出さない。 */
export const SELLER_EMAIL_DOMAIN = "sellers.farmille.internal";

// seller_accounts.login_id の CHECK 制約（migration 20260726121216）と同じ形。
export const LOGIN_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{2,30}$/;

export type SellerSignInResult = { sellerId: string };
export type SellerApplyInput = v.InferOutput<typeof manufacturerRegistrationSchema>;
export type SellerApplyFieldErrors = Partial<Record<keyof SellerApplyInput, string>>;
export type SellerApplyValidation =
  | { ok: true; input: SellerApplyInput }
  | { ok: false; fieldErrors: SellerApplyFieldErrors };
export type SellerApplyResult = { applied: true };

export function syntheticSellerEmail(loginId: string): string | null {
  const normalized = loginId.trim().toLowerCase();
  return LOGIN_ID_PATTERN.test(normalized) ? `${normalized}@${SELLER_EMAIL_DOMAIN}` : null;
}

/** 申請者が入力する連絡先を検証し、Farmille企業会員IDはサーバー側で発行する。 */
type SellerApplyFormValues = { [Key in keyof SellerApplyInput]: FormDataEntryValue | null };
export function validateSellerApply(raw: SellerApplyFormValues): SellerApplyValidation {
  const result = v.safeParse(manufacturerRegistrationSchema, raw);
  if (result.success) return { ok: true, input: result.output };
  const fieldErrors: SellerApplyFieldErrors = {};
  const nested = v.flatten(result.issues).nested;
  for (const key of Object.keys(manufacturerRegistrationSchema.entries)) {
    const parsedKey = v.parse(v.keyof(manufacturerRegistrationSchema), key);
    const message = nested?.[parsedKey]?.[0];
    if (message !== undefined) fieldErrors[parsedKey] = message;
  }
  return { ok: false, fieldErrors };
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

  const loginId = `m-${randomUUID().replaceAll("-", "").slice(0, 28)}`;
  const taken = await isLoginIdTaken(admin, loginId);
  if (!taken.ok) return taken;
  if (taken.data) return fail("login_id_taken");

  let inviteCode: string | null = null;
  if (input.inviteCode.length > 0) {
    const resolved = await resolveInviteCode(admin, input.inviteCode);
    if (!resolved.ok) return resolved;
    inviteCode = resolved.data;
  }

  // anon INSERT の RLS（status=applied・auth_user_id/approved_at NULL）を実効経路として使う。
  // applied 行は SELECT できないため RETURNING（.select）は付けない。
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("seller_accounts").insert({
    official_name: input.officialName,
    login_id: loginId,
    corporate_number: input.corporateNumber,
    contact_phone: input.contactPhone,
    material_request_notes: input.materialRequestNotes || null,
    contact_email: input.contactEmail,
    contact_name: input.contactName,
    location: input.location || null,
    region_scope: null,
    website_url: input.websiteUrl || null,
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
 * Farmille企業会員ID → seller_accounts（approved かつ共有ログイン発行済み）→ 合成メールで認証。
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

  // 未申請・確認中・却下・凍結、共有ログイン未発行はすべて同じ扱いにする。
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
