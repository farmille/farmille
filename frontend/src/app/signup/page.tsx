import type { Metadata } from "next";

import { SignupForm } from "@/app/signup/signup-form";
import { AuthScreen } from "@/components/auth/auth-screen";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "会員登録",
  description: "匿名で参加できる農業資材レビューのアカウントを作成します。",
  robots: NO_INDEX_ROBOTS,
};

export default function SignupPage() {
  return (
    <AuthScreen lead="匿名で参加できます。実名や所属の公開は不要です。" title="Farmilleをはじめる">
      <SignupForm />
    </AuthScreen>
  );
}
