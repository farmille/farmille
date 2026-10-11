import Link from "next/link";

import { buttonRecipe } from "@/components/Button";
import { FormActions } from "@/components/form";
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import { TextLink } from "@/components/TextLink";

import { css, cva } from "../../../styled-system/css";

const softCardStyle = css(surfaceCardRecipe.raw({ tone: "soft", padding: "cozy" }), {
  borderColor: "primary.700/22",
});

const typeLabelRecipe = cva({
  base: {
    px: "2",
    py: "0.5",
    borderRadius: "pill",
    fontSize: "xs",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  variants: {
    account: {
      general: { bg: "primary.100", color: "primary.800" },
      seller: { bg: "surface.page", color: "text.muted" },
    },
  },
});

const titleStyle = css({ mt: "2", textStyle: "title" });
const leadStyle = css({ mt: "1", textStyle: "supporting", color: "text.muted" });
const noteStyle = css({ mt: "1", textStyle: "supporting", color: "text.subtle" });
const actionStyle = css({ mt: "3" });

/** 一般ユーザーとメーカーを入力前に分け、異なる確認・ログイン方式を明示する。 */
export function AccountTypeChoice() {
  return (
    <>
      <div className={css({ display: "flex", flexDirection: "column", gap: "2.5" })}>
        <section className={softCardStyle} aria-labelledby="signup-general-title">
          <span className={typeLabelRecipe({ account: "general" })}>個人用アカウント</span>
          <h2 id="signup-general-title" className={titleStyle}>
            一般ユーザーとして登録
          </h2>
          <p className={leadStyle}>ニックネームで、感想口コミや実証詳細レポートを投稿できます。</p>
          <p className={noteStyle}>メールアドレスで登録します。運営による確認はありません。</p>
          <div className={actionStyle}>
            <Link className={buttonRecipe({ variant: "primary" })} href="/signup/general">
              一般ユーザー登録へ
            </Link>
          </div>
        </section>

        <section
          className={css(surfaceCardRecipe.raw({ padding: "cozy" }))}
          aria-labelledby="signup-seller-title"
        >
          <span className={typeLabelRecipe({ account: "seller" })}>メーカー用アカウント</span>
          <h2 id="signup-seller-title" className={titleStyle}>
            メーカーとして申請
          </h2>
          <p className={leadStyle}>
            自社の農業資材情報や記事を管理する、メーカー専用アカウントです。
          </p>
          <p className={noteStyle}>
            ログインIDを申請します。運営の確認後にログイン情報を発行します。
          </p>
          <div className={actionStyle}>
            <Link className={buttonRecipe({ variant: "ghost" })} href="/sellers">
              メーカー向けページへ
            </Link>
          </div>
        </section>
      </div>

      <FormActions layout="links">
        <TextLink href="/login" variant="plain">
          一般ユーザーの方はログイン
        </TextLink>
        <TextLink href="/sellers/login" variant="plain">
          メーカーの方はログイン
        </TextLink>
      </FormActions>
    </>
  );
}
