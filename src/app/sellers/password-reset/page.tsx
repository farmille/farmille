import type { Metadata } from "next";
import { SellerPasswordResetForm } from "@/app/sellers/password-reset/SellerPasswordResetForm";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = { title: "メーカーのパスワード再設定", robots: NO_INDEX_ROBOTS };
export default function SellerPasswordResetPage() {
  return (
    <AuthScreen
      title="メーカーのパスワード再設定"
      lead="Farmille企業会員IDと登録済みの連絡先を入力してください。連絡先が利用できない場合は運営へお問い合わせください。"
    >
      <SellerPasswordResetForm />
    </AuthScreen>
  );
}
