import type { Metadata } from "next";

import { SellerLoginForm } from "@/app/sellers/login/SellerLoginForm";
import { PasskeyLogin } from "@/components/auth/PasskeyLogin";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { FormMessage } from "@/components/auth/Fields";
import { safeNextPath } from "@/lib/auth/safe-next";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "メーカーログイン",
  robots: NO_INDEX_ROBOTS,
};

export default async function SellerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; password?: string }>;
}) {
  const { next, password } = await searchParams;

  return (
    <AuthScreen
      lead="承認済みのメーカーアカウントのログインIDでサインインします。"
      title="メーカーログイン"
    >
      {password === "changed" ? (
        <FormMessage tone="info">
          パスワードを変更しました。新しいパスワードでログインしてください。
        </FormMessage>
      ) : null}
      <SellerLoginForm next={safeNextPath(next)} />
      <PasskeyLogin next={safeNextPath(next) ?? "/dashboard"} />
    </AuthScreen>
  );
}
