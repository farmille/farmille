import type { Metadata } from "next";

import { SignupForm } from "@/app/signup/signup-form";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "会員登録 | Farmille",
  description: "匿名で参加できる農業資材レビューのアカウントを作成します。",
};

export default function SignupPage() {
  return (
    <AuthScreen lead="匿名で参加できます。実名や所属の公開は不要です。" title="Farmilleをはじめる">
      <SignupForm />
    </AuthScreen>
  );
}
