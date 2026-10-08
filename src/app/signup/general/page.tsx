import type { Metadata } from "next";

import { SignupForm } from "@/app/signup/SignupForm";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { safeNextPath } from "@/lib/auth/safe-next";

export const metadata: Metadata = {
  title: "一般ユーザー登録",
  description: "匿名で参加できる農業資材感想口コミの個人用アカウントを作成します。",
  robots: NO_INDEX_ROBOTS,
};

export default async function GeneralSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNextPath((await searchParams).next);
  return (
    <AuthScreen lead="匿名で参加できます。実名や所属の公開は不要です。" title="一般ユーザー登録">
      <SignupForm next={next} />
    </AuthScreen>
  );
}
