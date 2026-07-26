import type { Metadata } from "next";

import { LoginForm } from "@/app/login/login-form";
import { AuthScreen } from "@/components/auth/auth-screen";
import { FormMessage } from "@/components/auth/fields";
import { safeNextPath } from "@/lib/auth/safe-next";
import { errorMessageJa, type ErrorCode } from "@/server/errors";

export const metadata: Metadata = {
  title: "ログイン | Farmille",
};

function noticeOf(error: string | undefined): string | null {
  if (error === undefined) return null;

  return Object.hasOwn(errorMessageJa, error) ? errorMessageJa[error as ErrorCode] : null;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const notice = noticeOf(error);

  return (
    <AuthScreen lead="登録済みのメールアドレスでログインします。" title="ログイン">
      {notice === null ? null : <FormMessage tone="error">{notice}</FormMessage>}
      <LoginForm next={safeNextPath(next)} />
    </AuthScreen>
  );
}
