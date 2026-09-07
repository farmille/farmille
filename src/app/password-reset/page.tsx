import type { Metadata } from "next";

import { PasswordResetForm } from "@/app/password-reset/PasswordResetForm";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "パスワード再設定",
  robots: NO_INDEX_ROBOTS,
};

export default function PasswordResetPage() {
  return (
    <AuthScreen
      lead="登録済みのメールアドレスへ、再設定用のリンクを送ります。"
      title="パスワード再設定"
    >
      <PasswordResetForm />
    </AuthScreen>
  );
}
