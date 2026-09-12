import { Icon } from "@/components/Icon";
import Link from "next/link";

import { buttonRecipe } from "@/components/Button";
import { css } from "../../../styled-system/css";

const panel = css({
  p: "6",
  bg: "surface.card",
  borderWidth: "1px",
  borderColor: "border.default",
  borderRadius: "card",
  boxShadow: "shadow",
  tab: { p: "12" },
});
const title = css({
  m: "0",
  fontSize: "2xl",
  fontWeight: "700",
  lineHeight: "relaxed",
  textWrap: "balance",
});
const copy = css({ fontSize: "md", color: "text.muted", lineHeight: "relaxed" });
const actions = css({ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "3", mt: "5" });
const textLink = css({ color: "brand.primaryDeep", fontSize: "md", textDecoration: "none" });

/** 閲覧から体験の投稿へつなぎ、一般登録とメーカー向け案内を分ける。 */
export function HomeInvitations({ showSignup }: { showSignup: boolean }) {
  return (
    <>
      <section className={panel} aria-labelledby="share-experience-title">
        <h2 id="share-experience-title" className={title}>
          実際に使った体験を共有し、1人で何年もかかっていた試験を、1年で。
        </h2>
        <div className={copy}>
          <p>
            資材の種類は増えていますが、自分の畑で結果が出るかどうかは、使ってみるまで分かりません。
          </p>
          <p>いちばん参考になるのは、生産者が実際に使った体験です。</p>
          <p>Farmilleで、みなさんの体験を共有して、より良い資材選びを実現しましょう。</p>
        </div>
        <div className={actions}>
          <Link href="/post?type=report" className={buttonRecipe({ size: "sm" })}>
            使用レポートを投稿する
          </Link>
          <Link href="/post?type=review" className={buttonRecipe({ size: "sm" })}>
            レビューを投稿する
          </Link>
        </div>
      </section>
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
          <h2 id="signup-invitation-title" className={title}>
            会員登録して、あなたの体験を共有してください
          </h2>
          <div className={copy}>
            <p>
              <strong>登録は無料です。</strong>
              資材検索とレビュー・使用レポートの閲覧は、登録なしで利用できます。
            </p>
            <p>
              会員登録すると、使用レポートやレビューの投稿、参考になったの投票、検討リストへの保存ができます。
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
          <h2 id="manufacturer-invitation-title" className={title}>
            バイオスティミュラント・関連資材メーカー様へ
          </h2>
          <div className={copy}>
            <p>自社の資材情報の掲載・編集を申請できます。運営の承認後に公開情報へ反映されます。</p>
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
