import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminShell } from "@/app/admin/_components/AdminShell";
import { Panel } from "@/app/admin/_components/AdminUI";
import { requireAdminMfaPage } from "@/app/admin/_lib/access";
import { AdminMfaForms } from "@/app/admin/mfa/MFAForms";
import { safeNextPath } from "@/lib/auth/safe-next";
import { getAdminMfaState } from "@/server/admin/mfa";
import { errorMessageJa } from "@/server/errors";

export const metadata: Metadata = {
  title: "2要素認証",
};

export default async function AdminMfaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  await requireAdminMfaPage("/admin/mfa");

  const { next } = await searchParams;
  const requested = safeNextPath(next);
  // この画面自身へ戻すと堂々巡りになるため、既定の行き先へ寄せる。
  const target = requested === null || requested.startsWith("/admin/mfa") ? "/admin" : requested;

  const state = await getAdminMfaState();

  if (!state.ok) {
    throw new Error(errorMessageJa[state.error]);
  }

  if (state.data.currentLevel === "aal2") {
    redirect(target);
  }

  const registered = state.data.verifiedFactorId !== null;

  return (
    <AdminShell
      description="運営管理を開くには認証アプリでの2要素認証が必要です。パスキーでログインした場合も認証コードを入力してください。"
      title={registered ? "2要素認証" : "2要素認証の登録"}
    >
      <Panel title={registered ? "認証コードの入力" : "認証アプリの登録"}>
        <AdminMfaForms next={target} verifiedFactorId={state.data.verifiedFactorId} />
      </Panel>
    </AdminShell>
  );
}
