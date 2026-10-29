import type { Metadata } from "next";
import Link from "next/link";

import { AuthScreen } from "@/components/auth/AuthScreen";
import { buttonRecipe } from "@/components/Button";
import { Notice } from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

import { css } from "../../../../styled-system/css";

export const metadata: Metadata = { title: "退会の完了", robots: NO_INDEX_ROBOTS };

const bodyStyle = css({ mt: "4", mb: "6", textStyle: "body", color: "text.default" });

const linksStyle = css({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "2",
});

/** 退会してログアウトしたあとに開くので、ログインを求めない。 */
export default function WithdrawnPage() {
  return (
    <AuthScreen title="退会の完了">
      <Notice tone="success">退会の手続きが完了しました。</Notice>
      <div className={bodyStyle}>
        <p>これまでFarmilleをご利用いただき、ありがとうございました。</p>
        <p>
          投稿した実証詳細レポートと感想口コミは、投稿者名を「退会済みユーザー」として掲載を続けます。
        </p>
        <p>同じメールアドレスで、新しく会員登録できます。以前の投稿は引き継がれません。</p>
      </div>
      <div className={linksStyle}>
        <Link className={buttonRecipe({ variant: "ghost", size: "md" })} href="/">
          ホームへ
        </Link>
        <TextLink href="/signup" variant="plain">
          新しく会員登録する
        </TextLink>
      </div>
    </AuthScreen>
  );
}
