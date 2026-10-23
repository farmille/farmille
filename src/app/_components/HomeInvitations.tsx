import { Icon } from "@/components/Icon";
import Link from "next/link";

import { buttonRecipe } from "@/components/Button";
import { css } from "../../../styled-system/css";

const title = css({
  m: "0",
  fontSize: "2xl",
  lineHeight: "relaxed",
  textWrap: "balance",
});
const copy = css({ textStyle: "supporting", color: "text.muted" });
const textLink = css({ color: "text.brand", fontSize: "md", textDecoration: "none" });

export function HomeInvitations({ showSignup }: { showSignup: boolean }) {
  return (
    <>
      {showSignup ? (
        <section
          className={css({
            borderTopWidth: "1px",
            borderColor: "border.default",
            py: "10",
            textAlign: "center",
            tab: { py: "12" },
          })}
          aria-labelledby="signup-invitation-title"
        >
          <h1 id="signup-invitation-title" className={title}>
            登録は無料
          </h1>
          <div className={copy}>
            <p>検索と感想口コミの閲覧は、登録なしで利用できます。</p>
            <p>
              会員登録すると、実証詳細レポートの閲覧・投稿、感想口コミの投稿、お気に入りの保存ができます。
            </p>
          </div>
          <div
            className={css({
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "5",
              mt: "5",
            })}
          >
            <Link href="/signup/general" className={buttonRecipe({ size: "sm" })}>
              無料で会員登録
            </Link>
            <Link href="/search" className={textLink}>
              資材をさがす <Icon name="arrow_forward" size="sm" />
            </Link>
          </div>
        </section>
      ) : null}
      <section
        className={css({
          p: "6",
          borderWidth: "1px",
          borderColor: "border.default",
          borderRadius: "card",
          bg: "surface.panel",
          display: "flex",
          flexDirection: "column",
          gap: "5",
          tab: {
            p: "10",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          },
        })}
        aria-labelledby="manufacturer-invitation-title"
      >
        <div>
          <h1 id="manufacturer-invitation-title" className={title}>
            バイオスティミュラント・関連資材メーカー様へ
          </h1>
          <div className={copy}>
            <p>
              資材オーナー権限を確認後、製品情報をメーカーご自身で更新できます。下書きとプレビューを用意し、公開前に運営が表現を確認します。
            </p>
            <p>生産者が資材を比較するために、詳細な情報を掲載してください。</p>
          </div>
        </div>
        <Link href="/sellers" className={buttonRecipe({ size: "sm" })}>
          メーカー様はこちら <Icon name="arrow_forward" size="sm" />
        </Link>
      </section>
    </>
  );
}
