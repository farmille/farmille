import type { Metadata } from "next";

import { SellerLoginForm } from "@/app/sellers/login/SellerLoginForm";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { safeNextPath } from "@/lib/auth/safe-next";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "メーカーログイン",
  robots: NO_INDEX_ROBOTS,
};

export default async function SellerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthScreen
      lead="承認済みのメーカーアカウントのログインIDでサインインします。"
      title="メーカーログイン"
    >
      <SellerLoginForm next={safeNextPath(next)} />
    </AuthScreen>
  );
}
