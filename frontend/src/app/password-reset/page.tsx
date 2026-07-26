import type { Metadata } from "next";

import { PasswordResetForm } from "@/app/password-reset/password-reset-form";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "パスワード再設定 | Farmille",
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
