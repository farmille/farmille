import type { Metadata } from "next";
import Link from "next/link";

import { AuthScreen } from "@/components/auth/AuthScreen";
import {
  formActionsStyle,
  ghostButtonStyle,
  HintBox,
  linkRowStyle,
  textLinkStyle,
} from "@/components/auth/Fields";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { safeNextPath } from "@/lib/auth/safe-next";

export const metadata: Metadata = {
  title: "登録完了",
  robots: NO_INDEX_ROBOTS,
};

export default async function SignupDonePage({
  searchParams,
}: {
  searchParams: Promise<{ confirm?: string; next?: string }>;
}) {
  const { confirm, next: requestedNext } = await searchParams;
  const next = safeNextPath(requestedNext);
  const needsEmailConfirmation = confirm === "1";

  return (
    <AuthScreen
      lead={
        needsEmailConfirmation
          ? "確認メールを送信しました。メール内のリンクを開くと利用を開始できます。"
          : "ようこそ。さっそく資材の感想口コミを読んでみましょう。"
      }
      title="登録が完了しました"
    >
      <HintBox>
        アイコン画像・一言プロフィール・主な作目は、マイページからあとで設定できます。
      </HintBox>

      <div className={formActionsStyle}>
        {!needsEmailConfirmation && next ? (
          <Link className={ghostButtonStyle} href={next}>
            実証詳細レポートに戻る
          </Link>
        ) : null}
        <Link className={ghostButtonStyle} href="/">
          ホームへ
        </Link>
      </div>

      {needsEmailConfirmation ? (
        <div className={linkRowStyle}>
          <Link
            className={textLinkStyle}
            href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          >
            確認が済んだ方はログイン
          </Link>
        </div>
      ) : null}
    </AuthScreen>
  );
}
