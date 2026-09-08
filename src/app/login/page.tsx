import type { Metadata } from "next";

import { LoginForm } from "@/app/login/LoginForm";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { FormMessage } from "@/components/auth/Fields";
import { safeNextPath } from "@/lib/auth/safe-next";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { errorMessageJa } from "@/server/errors";

export const metadata: Metadata = {
  title: "ログイン",
  robots: NO_INDEX_ROBOTS,
};

function noticeOf(error: string | undefined): string | null {
  if (error === undefined) return null;

  return Object.entries(errorMessageJa).find(([code]) => code === error)?.[1] ?? null;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; password?: string }>;
}) {
  const { next, error, password } = await searchParams;
  const notice = noticeOf(error);

  return (
    <AuthScreen lead="登録済みのメールアドレスでログインします。" title="ログイン">
      {notice === null ? null : <FormMessage tone="error">{notice}</FormMessage>}
      {password === "changed" ? (
        <FormMessage tone="info">
          パスワードを変更しました。新しいパスワードでログインしてください。
        </FormMessage>
      ) : null}
      <LoginForm next={safeNextPath(next)} />
    </AuthScreen>
  );
}
