import type { Metadata } from "next";
import Link from "next/link";

import { UpdatePasswordForm } from "@/app/password-reset/update/UpdatePasswordForm";
import { buttonRecipe } from "@/components/Button";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { FormActions, Notice } from "@/components/form";
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
        <Notice tone="error">
          再設定用のリンクが確認できませんでした。もう一度メールの送信からやり直してください。
        </Notice>
        <FormActions>
          <Link className={buttonRecipe({ variant: "ghost", size: "md" })} href="/password-reset">
            一般・運営の再設定メールの送信へ
          </Link>
          <Link
            className={buttonRecipe({ variant: "ghost", size: "md" })}
            href="/sellers/password-reset"
          >
            メーカーの再設定メールの送信へ
          </Link>
        </FormActions>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen lead="新しいパスワードを設定します。" title="新しいパスワードの設定">
      <UpdatePasswordForm tokenHash={tokenHash} />
    </AuthScreen>
  );
}
