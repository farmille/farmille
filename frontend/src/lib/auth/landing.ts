import { isAdminRole, isMakerRole, isReviewerRole } from "./roles";

/**
 * ログイン済ユーザの role 別「ホーム」着地 path を返す。
 * ログイン済が前提（呼び出し元で getUser() null チェック済の想定）。
 * /home ラッパの分岐と同じセマンティクス。
 *
 * admin は ADR-0009 §2.2 / §6.1 に従い `/admin` に着地する。
 * admin はパブリックサインアップ経路を持たないため、ここに来る時点で
 * 既存ユーザ（farmer/maker/...）が Studio で手動昇格された後の再ログイン経路。
 */
export function landingPathForRole(role: string | null | undefined): string {
  if (isAdminRole(role)) return "/admin";
  if (isMakerRole(role)) return "/maker/products";
  if (isReviewerRole(role)) return "/products";
  return "/onboarding";
}
