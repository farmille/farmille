import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { registrationEmailAction } from "@/app/signup/actions";
import { RegistrationEmailForm } from "@/app/signup/RegistrationEmailForm";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { safeNextPath } from "@/lib/auth/safe-next";
import { getRegistrationIdentity } from "@/server/accounts/general";

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

  // 登録情報の入力中に同じ認証リンクを開き直した人は、使用済みのリンクでも本人証明が残っているので入力へ戻す
  if (params.error === "expired_link") {
    const identity = await getRegistrationIdentity();

    if (identity.ok)
      redirect(next ? `/signup/complete?next=${encodeURIComponent(next)}` : "/signup/complete");

    if (identity.error === "internal")
      throw new Error("メールアドレスの確認状態を取得できませんでした。");
  }

  const error =
    params.error === "expired_link"
      ? "この認証リンクは、使用済みか、有効期限（1時間）が切れています。登録を済ませた方は、ログインしてください。登録がまだの方は、いちばん新しい認証メールのリンクを開くか、下の欄から認証メールを受け取り直してください。"
      : params.error === "email_unavailable"
        ? "このメールアドレスは登録済みです。ログイン画面からログインしてください。"
        : undefined;

  return (
    <AuthScreen
      lead="まずメールアドレスを確認します。メール内のリンクから登録情報を入力してください。"
      title="一般ユーザー登録"
    >
      <RegistrationEmailForm action={registrationEmailAction} next={next} error={error} />
    </AuthScreen>
  );
}
