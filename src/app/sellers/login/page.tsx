import "../../_mock/forms.css";
import "../../_mock/sellers.css";

import type { Metadata } from "next";

import { FormNotice } from "@/app/_mock/FormParts";
import { MockPageShell } from "@/app/_mock/MockPageShell";
import { SellerLoginForm } from "@/app/sellers/login/SellerLoginForm";
import { PasskeyLogin } from "@/components/auth/PasskeyLogin";
import { safeNextPath } from "@/lib/auth/safe-next";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "メーカーログイン",
  robots: NO_INDEX_ROBOTS,
};

function destinationLabelOf(destination: string | null): string | null {
  if (destination === null) return null;
  if (destination.startsWith("/dashboard/applications/new/registration"))
    return "資材掲載・資材オーナー権限申請";
  if (destination.startsWith("/dashboard/applications/new/transfer_out"))
    return "資材オーナー権限の移行申請（現資材オーナー企業）";
  if (destination.startsWith("/dashboard/applications/new/transfer_in"))
    return "資材オーナー権限の移行申請（引き継ぎ先企業）";
  if (destination.startsWith("/dashboard/applications")) return "各種お手続き";
  if (destination.startsWith("/dashboard/materials")) return "製品情報の管理";
  if (destination.startsWith("/dashboard/profile")) return "メーカープロフィールの編集";
  if (destination.startsWith("/dashboard")) return "企業会員ダッシュボード";
  return null;
}

/** 見本 S.sellerLogin。パスキーのログインとパスワード変更後のお知らせは本番の機能として残す。 */
export default async function SellerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; password?: string }>;
}) {
  const { next, password } = await searchParams;
  const destination = safeNextPath(next);
  const destinationLabel = destinationLabelOf(destination);

  return (
    <MockPageShell title="メーカーログイン" backHref="/sellers">
      <div className="fm-narrow" style={{ maxWidth: 520, marginInline: "auto" }}>
        {destinationLabel === null ? null : (
          <div className="login-note" role="status">
            「{destinationLabel}
            」は、企業会員のログインが必要です。企業会員でない方は、先に企業会員登録をお申し込みください。
          </div>
        )}
        {password === "changed" ? (
          <FormNotice tone="info">
            パスワードを変更しました。新しいパスワードでログインしてください。
          </FormNotice>
        ) : null}
        <h1 style={{ fontSize: 19 }}>メーカーログイン</h1>
        <p className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
          企業会員のログインIDでサインインします。
        </p>
        <SellerLoginForm next={destination} />
        <PasskeyLogin next={destination ?? "/dashboard"} />
      </div>
    </MockPageShell>
  );
}
