import { isMakerRole, isReviewerRole } from "./roles";

/**
 * ログイン済ユーザの role 別「ホーム」着地 path を返す。
 * ログイン済が前提（呼び出し元で getUser() null チェック済の想定）。
 * /home ラッパの分岐と同じセマンティクス。
 */
export function landingPathForRole(role: string | null | undefined): string {
  if (isMakerRole(role)) return "/maker/products";
  if (isReviewerRole(role)) return "/products";
  return "/onboarding";
}
