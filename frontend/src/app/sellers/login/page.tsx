import type { Metadata } from "next";

import { SellerLoginForm } from "@/app/sellers/login/seller-login-form";
import { AuthScreen } from "@/components/auth/auth-screen";
import { safeNextPath } from "@/lib/auth/safe-next";

export const metadata: Metadata = {
  title: "出品者ログイン | Farmille",
};

export default async function SellerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthScreen
      lead="承認済みの出品者アカウントのログインIDでサインインします。"
      title="出品者ログイン"
    >
      <SellerLoginForm next={safeNextPath(next)} />
    </AuthScreen>
  );
}
