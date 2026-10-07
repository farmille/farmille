import Link from "next/link";

import { buttonRecipe } from "@/components/Button";
import { css, cva } from "../../../styled-system/css";

const signupStyle = css({
  mt: "8",
  pt: "11",
  px: "4.5",
  pb: "10",
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "border.default",
  textAlign: "center",
  tab: { mt: "12", pt: "20", px: "6", pb: "16" },
});

const signupBodyStyle = css({
  mt: "3",
  color: "text.muted",
  fontSize: "sm",
  lineHeight: "loose",
  tab: { mt: "4", fontSize: "md" },
});

const pcOnlyBreak = css({ display: "none", tab: { display: "inline" } });

const signupButtonStyle = css(buttonRecipe.raw({ variant: "primary" }), {
  w: "auto",
  px: "7.5",
  py: "3.5",
});

const moreLinkStyle = css({
  color: "primary.700",
  fontSize: "md",
  textDecoration: "none",
  whiteSpace: "nowrap",
});

const makerBandRecipe = cva({
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "3.5",
    py: "5.5",
    px: "5",
    bg: "surface.page",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    borderRadius: "card",
    tab: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "10",
      py: "9",
      px: "11",
    },
  },
  variants: { afterSignup: { true: {}, false: { mt: "8" } } },
});

const makerButtonStyle = css(buttonRecipe.raw({ variant: "primary", size: "sm" }), {
  alignSelf: "flex-start",
  gap: "1",
  px: "4",
  tab: { alignSelf: "center", flex: "none", py: "3", px: "6" },
});

export function HomeInvitations({ showSignup }: { showSignup: boolean }) {
  return (
    <>
      {showSignup ? (
        <section className={signupStyle} aria-labelledby="signup-invitation-title">
          <h2
            id="signup-invitation-title"
            className={css({ fontSize: "3xl", lineHeight: "normal" })}
          >
            会員登録して、あなたの体験を共有してください
          </h2>
          <p className={signupBodyStyle}>
            <span className={css({ color: "primary.800", fontWeight: "extrabold" })}>
              登録は無料で、1分で完了します。
            </span>
            検索と感想口コミの閲覧は、登録なしで利用できます。
            <br className={pcOnlyBreak} />
            会員登録すると、実証詳細レポートの閲覧・投稿、感想口コミの投稿、お気に入りの保存ができます。
          </p>
          <div
            className={css({
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "4.5",
              mt: "5",
            })}
          >
            <Link className={signupButtonStyle} href="/signup/general">
              無料で会員登録
            </Link>
            <Link className={moreLinkStyle} href="/search">
              資材をさがす <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      ) : null}
      <section
        className={makerBandRecipe({ afterSignup: showSignup })}
        aria-labelledby="manufacturer-invitation-title"
      >
        <div>
          <h3
            id="manufacturer-invitation-title"
            className={css({ mt: "1.5", fontSize: "lg", tab: { fontSize: "3xl" } })}
          >
            バイオスティミュラント・関連資材メーカー様へ
          </h3>
          <p
            className={css({
              mt: "2",
              color: "text.muted",
              fontSize: "sm",
              lineHeight: "prose",
              tab: { maxW: "calc(token(sizes.96) + token(sizes.44))" },
            })}
          >
            資材ページの編集権を確認後、製品情報をメーカーご自身で更新できます。
            <br />
            下書きとプレビューを用意し、公開前に運営が表現を確認します。
            <br />
            生産者が資材を比較するために、詳細な情報を掲載してください。
          </p>
        </div>
        <Link className={makerButtonStyle} href="/sellers">
          メーカー様はこちら <span aria-hidden="true">→</span>
        </Link>
      </section>
    </>
  );
}
