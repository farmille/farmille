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
  const destination = safeNextPath(next);
  const destinationLabel = destination?.startsWith("/dashboard/applications/new/registration")
    ? "資材掲載・資材オーナー権限申請"
    : destination?.startsWith("/dashboard/applications/new/transfer_out")
      ? "資材オーナー権限の移行申請（現資材オーナー企業）"
      : destination?.startsWith("/dashboard/applications/new/transfer_in")
        ? "資材オーナー権限の移行申請（引き継ぎ先企業）"
        : destination?.startsWith("/dashboard/applications")
          ? "各種お手続き"
          : destination?.startsWith("/dashboard/materials")
            ? "製品情報の管理"
            : destination?.startsWith("/dashboard/profile")
              ? "メーカープロフィールの編集"
              : destination?.startsWith("/dashboard")
                ? "企業会員ダッシュボード"
                : null;

  return (
    <AuthScreen lead="企業会員のログインIDでサインインします。" title="メーカーログイン">
      {destinationLabel && (
        <FormMessage tone="info">
          「{destinationLabel}
          」は、企業会員のログインが必要です。企業会員でない方は、先に企業会員登録をお申し込みください。
        </FormMessage>
      )}
      {password === "changed" ? (
        <FormMessage tone="info">
          パスワードを変更しました。新しいパスワードでログインしてください。
        </FormMessage>
      ) : null}
      <SellerLoginForm next={destination} />
      <PasskeyLogin next={destination ?? "/dashboard"} />
    </AuthScreen>
  );
}
