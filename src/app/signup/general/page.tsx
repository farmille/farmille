import type { Metadata } from "next";

import { RegistrationEmailForm } from "@/app/signup/RegistrationEmailForm";
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
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const error =
    params.error === "expired_link"
      ? "認証リンクの有効期限が切れているか、すでに使用されています。メールアドレスを入力して認証メールを再送してください。"
      : params.error === "email_unavailable"
        ? "このメールアドレスは登録済みです。ログイン画面からログインしてください。"
        : undefined;
  return (
    <AuthScreen
      lead="まずメールアドレスを確認します。メール内のリンクから登録情報を入力してください。"
      title="一般ユーザー登録"
    >
      <RegistrationEmailForm next={next} error={error} />
    </AuthScreen>
  );
}
