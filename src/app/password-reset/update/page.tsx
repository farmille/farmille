import type { Metadata } from "next";
import Link from "next/link";

import { UpdatePasswordForm } from "@/app/password-reset/update/UpdatePasswordForm";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { formActionsStyle, FormMessage, ghostButtonStyle } from "@/components/auth/Fields";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "新しいパスワードの設定",
  robots: NO_INDEX_ROBOTS,
};

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string }>;
}) {
  const { token_hash: tokenHash } = await searchParams;
  if (!tokenHash || !/^[a-zA-Z0-9_-]{32,256}$/.test(tokenHash)) {
    return (
      <AuthScreen title="新しいパスワードの設定">
        <FormMessage tone="error">
          再設定用のリンクが確認できませんでした。もう一度メールの送信からやり直してください。
        </FormMessage>
        <div className={formActionsStyle}>
          <Link className={ghostButtonStyle} href="/password-reset">
            一般・運営の再設定メールの送信へ
          </Link>
          <Link className={ghostButtonStyle} href="/sellers/password-reset">
            メーカーの再設定メールの送信へ
          </Link>
        </div>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen lead="新しいパスワードを設定します。" title="新しいパスワードの設定">
      <UpdatePasswordForm tokenHash={tokenHash} />
    </AuthScreen>
  );
}
