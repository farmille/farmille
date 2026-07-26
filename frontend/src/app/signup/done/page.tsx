import type { Metadata } from "next";
import Link from "next/link";

import { AuthScreen } from "@/components/auth/auth-screen";
import {
  formActionsStyle,
  ghostButtonStyle,
  HintBox,
  linkRowStyle,
  textLinkStyle,
} from "@/components/auth/fields";

export const metadata: Metadata = {
  title: "登録完了 | Farmille",
};

export default async function SignupDonePage({
  searchParams,
}: {
  searchParams: Promise<{ confirm?: string }>;
}) {
  const { confirm } = await searchParams;
  const needsEmailConfirmation = confirm === "1";

  return (
    <AuthScreen
      lead={
        needsEmailConfirmation
          ? "確認メールを送信しました。メール内のリンクを開くと利用を開始できます。"
          : "ようこそ。さっそく資材のレビューを読んでみましょう。"
      }
      title="登録が完了しました"
    >
      <HintBox>
        アイコン画像・一言プロフィール・主な作目は、マイページからあとで設定できます。
      </HintBox>

      <div className={formActionsStyle}>
        <Link className={ghostButtonStyle} href="/">
          ホームへ
        </Link>
      </div>

      {needsEmailConfirmation ? (
        <div className={linkRowStyle}>
          <Link className={textLinkStyle} href="/login">
            確認が済んだ方はログイン
          </Link>
        </div>
      ) : null}
    </AuthScreen>
  );
}
