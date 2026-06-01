import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReportForm } from "./_components/report-form";

export const metadata: Metadata = {
  title: "ユーザーを通報",
};

// 2026-05-27: 公開 user-on-user 通報フォーム。
// 例: /report/user/<uuid>?from=/products/<pid>
// auth 必須、target が見つからなければ 404 相当のメッセージ。

type PageProps = {
  params: Promise<{ user_id: string }>;
  searchParams?: Promise<{ from?: string }>;
};

export default async function ReportUserPage({ params, searchParams }: PageProps) {
  const { user_id } = await params;
  const sp = (await searchParams) ?? {};
  const from = sanitizeFrom(sp.from);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/report/user/${encodeURIComponent(user_id)}`);
  }

  // 対象ユーザーの表示名解決が必要になった場合は、必ず BFF (FastAPI) 経由で行う。
  // クライアントから supabase.from(...) を直接叩く / service_role をフロントに
  // 持ち込むのは BFF 原則・シークレット境界の違反 (CLAUDE.md)。v1 は名前を出さず
  // user_id ベースで通報を受ける fail-safe 実装とする。
  const isSelfTarget = user.id === user_id;

  if (isSelfTarget) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12 space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">通報</h1>
        <div className="rounded-md border border-border bg-card p-6 text-center space-y-3">
          <p className="text-sm text-foreground">
            自分自身を通報することはできません。
          </p>
          <Link
            href={from ?? "/"}
            className="inline-block rounded border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            戻る
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          ユーザーを通報する
        </h1>
        <p className="text-sm text-muted-foreground">
          下のフォームから通報内容を送信できます。Farmille 運営が内容を確認し、必要に応じて対応します。<br />
          虚偽の通報や繰り返しの spam 通報は、通報者側のアカウント制限対象となります。
        </p>
      </header>

      <ReportForm targetUserId={user_id} backHref={from ?? "/products"} />

      <p className="text-xs text-muted-foreground">
        通報はあなたと運営のみが確認できます。通報相手には通知されません。
      </p>
    </main>
  );
}

function sanitizeFrom(raw: string | undefined): string | null {
  if (!raw) return null;
  // open redirect 防止: 相対パスのみ許可
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  return raw;
}
