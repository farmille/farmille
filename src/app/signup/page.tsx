import type { Metadata } from "next";

import { AccountTypeChoice } from "@/app/signup/AccountTypeChoice";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "アカウント登録",
  description: "一般ユーザーとメーカーから、利用方法に合う登録方法を選びます。",
  robots: NO_INDEX_ROBOTS,
};

export default function SignupPage() {
  return (
    <AuthScreen lead="利用方法に合うアカウントを選んでください。" title="アカウントを作成">
      <AccountTypeChoice />
    </AuthScreen>
  );
}
