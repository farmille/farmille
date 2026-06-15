import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getRole, getUser } from "@/lib/auth/server";
import { PasswordChangeForm } from "./_components/password-change-form";

export const metadata: Metadata = {
  title: "アカウント設定",
};

// アカウント設定 / マイページ (2026-06-13 奥田さん指示 6-15 定例)。
// 全ログインロール共通の最小マイページ: メールアドレス確認 + パスワード変更。
// farmer のプロフィール編集は /me/profile、maker は /maker/profile に別途あり、
// ここは「ログイン中ならどのロールでも」開ける普遍的なアカウント面とする。
//
// パスワード変更はログイン済セッションで supabase.auth.updateUser を呼ぶため
// SMTP 不要（パスワード「リセット」メール経路とは別。リセットは /password-reset）。

const ROLE_LABEL: Record<string, string> = {
  farmer: "生産者",
  ja_staff: "JA 職員",
  researcher: "研究者",
  maker: "メーカー",
  admin: "運営",
  unassigned: "未設定",
};

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/settings");
  }
  const role = await getRole(user);
  const roleLabel = role ? (ROLE_LABEL[role] ?? role) : "未設定";

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          アカウント設定
        </h1>
        <p className="text-sm text-muted-foreground">
          ログイン情報とパスワードを管理します。
        </p>
      </header>

      <section className="space-y-3 rounded-md border border-border bg-card p-6">
        <h2 className="text-base font-medium text-foreground">アカウント情報</h2>
        <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
          <dt className="text-muted-foreground">メールアドレス</dt>
          <dd className="text-foreground break-all">{user.email ?? "—"}</dd>
          <dt className="text-muted-foreground">属性</dt>
          <dd className="text-foreground">{roleLabel}</dd>
        </dl>
      </section>

      <section className="space-y-3 rounded-md border border-border bg-card p-6">
        <h2 className="text-base font-medium text-foreground">
          パスワード変更
        </h2>
        <p className="text-sm text-muted-foreground">
          新しいパスワード（6 文字以上）を設定します。変更後も現在のログインは維持されます。
        </p>
        <PasswordChangeForm />
      </section>
    </div>
  );
}
