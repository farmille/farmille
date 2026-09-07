import Link from "next/link";

import { buttonRecipe, SurfaceCard } from "@/components";
import { linkRowStyle, textLinkStyle } from "@/components/auth/Fields";
import { css } from "../../../styled-system/css";

const choicesStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "3",
});

const accountTypeStyle = css({
  display: "inline-block",
  mb: "2",
  color: "text.subtle",
  fontSize: "xs",
  fontWeight: "700",
});

const detailsStyle = css({
  mt: "0",
  mx: "0",
  mb: "4",
  color: "text.muted",
  fontSize: "sm",
  lineHeight: "1.65",
});

/** 一般ユーザーとメーカーを入力前に分け、異なる審査・ログイン方式を明示する。 */
export function AccountTypeChoice() {
  return (
    <>
      <div className={choicesStyle}>
        <SurfaceCard
          description="匿名・ハンドルネームで、レビューや使用レポートを投稿できます。"
          title="一般ユーザーとして登録"
        >
          <span className={accountTypeStyle}>個人用アカウント</span>
          <p className={detailsStyle}>メールアドレスで登録します。運営による審査はありません。</p>
          <Link className={buttonRecipe({ variant: "ghost", size: "md" })} href="/signup/general">
            一般ユーザー登録へ
          </Link>
        </SurfaceCard>

        <SurfaceCard
          description="自社の農業資材情報や記事を管理する、メーカー専用アカウントです。"
          title="メーカーとして申請"
        >
          <span className={accountTypeStyle}>メーカー用アカウント</span>
          <p className={detailsStyle}>
            ログインIDを申請します。運営の審査後にログイン情報を発行します。
          </p>
          <Link className={buttonRecipe({ variant: "ghost", size: "md" })} href="/sellers">
            メーカー向けページへ
          </Link>
        </SurfaceCard>
      </div>

      <div className={linkRowStyle}>
        <Link className={textLinkStyle} href="/login">
          一般ユーザーの方はログイン
        </Link>
        <Link className={textLinkStyle} href="/sellers/login">
          メーカーの方はログイン
        </Link>
      </div>
    </>
  );
}
