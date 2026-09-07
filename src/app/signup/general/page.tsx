import type { Metadata } from "next";

import { SignupForm } from "@/app/signup/SignupForm";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "一般ユーザー登録",
  description: "匿名で参加できる農業資材レビューの個人用アカウントを作成します。",
  robots: NO_INDEX_ROBOTS,
};

export default function GeneralSignupPage() {
  return (
    <AuthScreen lead="匿名で参加できます。実名や所属の公開は不要です。" title="一般ユーザー登録">
      <SignupForm />
    </AuthScreen>
  );
}
