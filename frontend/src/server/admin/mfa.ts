import type { AuthError } from "@supabase/supabase-js";

import { requireAdminAccount, reportAdminError } from "@/server/admin/guard";
import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";

/** admin の MFA（TOTP）は 01 §4 の AAL2 必須要件を満たすための唯一の手段。 */
const FRIENDLY_NAME = "farmille-admin";

export type AdminMfaState = {
  /** 検証済みの TOTP factor。ある場合はコード入力（challenge）だけで AAL2 に上がる。 */
  verifiedFactorId: string | null;
  currentLevel: "aal1" | "aal2" | null;
  nextLevel: "aal1" | "aal2" | null;
};

export type TotpEnrollment = {
  factorId: string;
  /** SVG の data URI。認証アプリで読み取る。 */
  qrCode: string;
  /** QR を読めない場合の手入力用。 */
  secret: string;
  uri: string;
};

function reportError(operation: string, error: unknown): void {
  reportAdminError("mfa", operation, error);
}

/**
 * MFA 操作のエラー写像。認証コード誤りとレート超過は画面で区別して伝えたいので、
 * 共通辞書のコード（invalid_body / rate_limited / forbidden / internal）へ落とす。
 */
function toMfaErrorCode(error: AuthError, operation: string) {
  switch (error.code) {
    case "mfa_verification_failed":
    case "mfa_challenge_expired":
      return "invalid_body" as const;
    case "over_request_rate_limit":
    case "over_mfa_rate_limit":
      return "rate_limited" as const;
    case "mfa_totp_enroll_not_enabled":
    case "mfa_totp_verify_not_enabled":
      // Supabase プロジェクト側で TOTP が無効。設定不足を握り潰さず forbidden で表に出す。
      reportError(`${operation}: TOTP が Supabase 側で無効になっています`, error.code);
      return "forbidden" as const;
    default:
      break;
  }

  if (error.status === 429) return "rate_limited" as const;

  reportError(operation, `${error.code ?? "unknown"} ${error.message}`);

  return "internal" as const;
}

/** 現在の admin の MFA 状態。AAL の判定は JWT 由来。 */
export async function getAdminMfaState(): Promise<Result<AdminMfaState>> {
  const account = await requireAdminAccount();
  if (!account.ok) return account;

  const supabase = await createServerSupabase();
  const [factors, aal] = await Promise.all([
    supabase.auth.mfa.listFactors(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);

  if (factors.error !== null) return fail(toMfaErrorCode(factors.error, "factor 一覧の取得"));
  if (aal.error !== null) return fail(toMfaErrorCode(aal.error, "AAL の取得"));

  const verified = factors.data.all.find(
    (factor) => factor.factor_type === "totp" && factor.status === "verified",
  );

  return succeed({
    verifiedFactorId: verified?.id ?? null,
    currentLevel: aal.data.currentLevel,
    nextLevel: aal.data.nextLevel,
  });
}

/**
 * TOTP の登録を開始する。未検証の factor が残っていると friendly_name が衝突するため、
 * 開始のたびに未検証分を破棄してから作り直す（画面の再読み込みで詰まらせない）。
 */
export async function startAdminTotpEnrollment(): Promise<Result<TotpEnrollment>> {
  const account = await requireAdminAccount();
  if (!account.ok) return account;

  const supabase = await createServerSupabase();
  const factors = await supabase.auth.mfa.listFactors();

  if (factors.error !== null) return fail(toMfaErrorCode(factors.error, "factor 一覧の取得"));

  const verified = factors.data.all.find(
    (factor) => factor.factor_type === "totp" && factor.status === "verified",
  );
  // 登録済みの factor がある状態での再登録は求めない（AAL2 への昇格は challenge で行う）。
  if (verified !== undefined) return fail("conflict");

  for (const factor of factors.data.all) {
    if (factor.status !== "unverified") continue;

    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (error !== null) return fail(toMfaErrorCode(error, "未検証 factor の破棄"));
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: FRIENDLY_NAME,
  });

  if (error !== null) return fail(toMfaErrorCode(error, "TOTP の登録開始"));

  return succeed({
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  });
}

/**
 * 認証コードの検証。登録直後の確定と、AAL1 セッションの AAL2 昇格の両方を兼ねる。
 * 成功すると Supabase が新しいセッション（aal2）を発行するので、
 * cookie を書ける Server Action / Route Handler からのみ呼ぶ。
 */
export async function verifyAdminTotpCode(factorId: string, code: string): Promise<Result<null>> {
  const account = await requireAdminAccount();
  if (!account.ok) return account;

  const normalized = code.replaceAll(/\s/gu, "");
  if (!/^\d{6}$/u.test(normalized)) return fail("invalid_body");

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: normalized });

  if (error !== null) return fail(toMfaErrorCode(error, "認証コードの検証"));

  return succeed(null);
}
