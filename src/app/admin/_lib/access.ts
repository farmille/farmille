import { notFound, redirect } from "next/navigation";

import { requireAdminAccount } from "@/server/admin/guard";
import { requireAdmin, type AdminSession } from "@/server/auth";

/**
 * 運営管理画面の共通ガード（01 §4）。全ページの先頭で呼ぶ。
 *   - 未ログイン → 一般ログインへ（admin も /login から入る）
 *   - AAL1 の admin → MFA 登録・認証へ
 *   - admin 以外のログイン済みユーザー → 404。運営画面の存在自体を明かさない
 */
export async function requireAdminPage(nextPath: string): Promise<AdminSession> {
  const session = await requireAdmin();

  if (session.ok) return session.data;

  if (session.error === "unauthorized") {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  if (session.error === "aal2_required") {
    redirect(`/admin/mfa?next=${encodeURIComponent(nextPath)}`);
  }

  notFound();
}

/**
 * `/admin/mfa` 専用のガード。AAL2 を満たすための画面なので AAL は要求しない。
 * すでに AAL2 なら本来の行き先へ戻す。
 */
export async function requireAdminMfaPage(nextPath: string): Promise<{ userId: string }> {
  const account = await requireAdminAccount();

  if (account.ok) return account.data;

  if (account.error === "unauthorized") {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  notFound();
}
