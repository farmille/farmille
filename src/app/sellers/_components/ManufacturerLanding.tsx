import Link from "next/link";

import { buttonRecipe } from "@/components";
import { Icon } from "@/components/Icon";
import {
  BS_GUIDELINE_TITLE,
  BS_GUIDELINE_URL,
  MANUFACTURER_ONBOARDING_STEPS,
} from "@/lib/manufacturer-policy";
import { css, cx } from "../../../../styled-system/css";

const hero = css({
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "green/25",
  borderRadius: "card",
  bg: "brand.soft",
  overflow: "hidden",
  tab: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
    alignItems: "stretch",
  },
});

const heroCopy = css({
  px: "4",
  py: "7",
  tab: { px: "9", py: "12" },
});

const eyebrow = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  mb: "3",
  color: "brand.primaryDeep",
  fontSize: "xs",
  fontWeight: "800",
  letterSpacing: "0.04em",
});

const title = css({
  m: "0",
  maxW: "content.reading",
  color: "text.default",
  fontSize: "3xl",
  fontWeight: "800",
  lineHeight: "tight",
  letterSpacing: "-0.02em",
});

const lead = css({
  maxW: "content.reading",
  mt: "3",
  mb: "0",
  color: "text.muted",
  fontSize: "md",
  lineHeight: "relaxed",
});

const actions = css({
  display: "flex",
  flexDirection: "column",
  gap: "2.5",
  mt: "5",
  tab: { flexDirection: "row", alignItems: "center" },
});

const actionButton = css({
  w: "100%",
  textAlign: "center",
  tab: { w: "auto", minW: "52" },
});

const approvalPanel = css({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: "3",
  px: "4",
  py: "6",
  bg: "surface.card",
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "green/25",
  tab: {
    px: "7",
    borderTopWidth: "0",
    borderLeftWidth: "1px",
    borderLeftStyle: "solid",
    borderLeftColor: "green/25",
  },
});

const approvalTitle = css({
  m: "0",
  color: "text.default",
  fontSize: "md",
  fontWeight: "800",
});

const approvalFlow = css({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "2",
});

const flowItem = css({
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  minH: "12",
  px: "3",
  py: "2.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "button",
  bg: "surface.panel",
  color: "text.default",
  fontSize: "sm",
  fontWeight: "700",
});

const flowNumber = css({
  display: "grid",
  placeItems: "center",
  flex: "0 0 auto",
  w: "7",
  h: "7",
  borderRadius: "pill",
  bg: "brand.primary",
  color: "surface.card",
  fontSize: "xs",
  fontWeight: "800",
});

const section = css({
  mt: "10",
  tab: { mt: "12" },
});

const sectionHeading = css({
  m: "0",
  color: "text.default",
  fontSize: "2xl",
  fontWeight: "800",
  lineHeight: "tight",
});

const sectionLead = css({
  mt: "2",
  mb: "0",
  color: "text.muted",
  fontSize: "sm",
  lineHeight: "relaxed",
});

const featureGrid = css({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "3",
  mt: "5",
  tab: { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" },
});

const featureCard = css({
  px: "5",
  py: "5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  bg: "surface.card",
  boxShadow: "shadow",
});

const featureIndex = css({
  display: "grid",
  placeItems: "center",
  w: "9",
  h: "9",
  mb: "3.5",
  borderRadius: "pill",
  bg: "brand.soft",
  color: "brand.primaryDeep",
  fontSize: "sm",
  fontWeight: "800",
});

const featureTitle = css({
  m: "0",
  color: "text.default",
  fontSize: "md",
  fontWeight: "800",
});

const featureBody = css({
  mt: "2",
  mb: "0",
  color: "text.muted",
  fontSize: "sm",
  lineHeight: "relaxed",
});

const closing = css({
  mt: "10",
  px: "4",
  py: "7",
  borderRadius: "card",
  bg: "brand.primary",
  color: "surface.card",
  textAlign: "center",
  tab: { px: "7" },
});

const closingTitle = css({
  m: "0",
  fontSize: "xl",
  fontWeight: "800",
});

const closingBody = css({
  mt: "2",
  mb: "0",
  fontSize: "sm",
  lineHeight: "relaxed",
  opacity: "0.9",
});

const closingActions = css({
  display: "flex",
  flexDirection: "column",
  gap: "2.5",
  maxW: "content.form",
  mx: "auto",
  mt: "5",
  tab: { flexDirection: "row", justifyContent: "center" },
});

const closingPrimary = css({
  w: "100%",
  bg: "surface.card",
  color: "brand.primaryDeep",
  tab: { w: "auto", minW: "52" },
});

const closingSecondary = css({
  w: "100%",
  bg: "transparent",
  color: "surface.card",
  borderColor: "surface.card",
  tab: { w: "auto", minW: "52" },
});

const closingSecondaryLabel = css({ color: "surface.card" });

export type ManufacturerLandingProps = {
  applyHref: "/sellers/apply" | "/sellers/apply?from=me";
};

const FEATURES = [
  {
    title: "自社資材をまとめて管理",
    body: "編集権を持つ資材ページを、メーカー自身で編集できます。未入力で「−」と表示される項目も、貴社の記入で埋められます。",
  },
  {
    title: "下書きとプレビューで確認",
    body: "製品説明・画像・資料・施用方法などを保存し、公開時の見え方を確認できます。運営は公開前の表現確認を行います。",
  },
  {
    title: "会社の紹介も掲載",
    body: "メーカーページに会社紹介・ロゴ・リンクを掲載できます。メーカー名義の記事も発信できます。申請・掲載・編集は無料です。",
  },
] as const;

/** メーカーが申請前に、対象条件・権限・承認フローを確認するためのLP本文。 */
export function ManufacturerLanding({ applyHref }: ManufacturerLandingProps) {
  return (
    <>
      <section className={hero} aria-labelledby="manufacturer-landing-title">
        <div className={heroCopy}>
          <span className={eyebrow}>
            <Icon name="check" size="sm" />
            農業資材メーカーの方へ
          </span>
          <h1 id="manufacturer-landing-title" className={title}>
            自社資材の情報を、正確に届ける。
          </h1>
          <p className={lead}>
            自社の資材ページを、メーカー自身の言葉で更新できます。運営は編集権をお渡しする前の所有権確認と、公開前の表現確認・掲載後の監査を行います。申請・掲載・編集は無料です。
          </p>
          <div className={actions}>
            <Link
              className={cx(buttonRecipe({ variant: "primary", size: "md" }), actionButton)}
              href={applyHref}
            >
              メーカーアカウントを申請
            </Link>
            <Link
              className={cx(buttonRecipe({ variant: "ghost", size: "md" }), actionButton)}
              href="/sellers/login"
            >
              ログイン
            </Link>
          </div>
        </div>

        <div className={approvalPanel} aria-label="情報公開までの流れ">
          <p className={approvalTitle}>掲載と情報管理の流れ</p>
          <div className={approvalFlow}>
            {MANUFACTURER_ONBOARDING_STEPS.map((step, index) => (
              <div className={flowItem} key={step.title}>
                <span className={flowNumber}>{index + 1}</span>
                {step.title}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={section} aria-labelledby="manufacturer-features-title">
        <h2 id="manufacturer-features-title" className={sectionHeading}>
          メーカーアカウントでできること
        </h2>
        <p className={sectionLead}>製品を選び、公開ページと同じ構成で情報を編集できます。</p>
        <div className={featureGrid}>
          {FEATURES.map((feature, index) => (
            <article className={featureCard} key={feature.title}>
              <span className={featureIndex}>{index + 1}</span>
              <h3 className={featureTitle}>{feature.title}</h3>
              <p className={featureBody}>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={section} aria-labelledby="manufacturer-flow-title">
        <h2 id="manufacturer-flow-title" className={sectionHeading}>
          申請から運用開始まで
        </h2>
        <p className={sectionLead}>
          掲載済みのページを引き継ぐため、これまでの口コミやレポートも同じ資材に残ります。
        </p>
        {MANUFACTURER_ONBOARDING_STEPS.map((step, index) => (
          <article className={featureCard} key={step.title}>
            <h3 className={featureTitle}>
              {index + 1}．{step.title}
            </h3>
            <p className={featureBody}>{step.body}</p>
          </article>
        ))}
      </section>

      <section className={section} aria-labelledby="manufacturer-policy-title">
        <h2 id="manufacturer-policy-title" className={sectionHeading}>
          掲載情報と表現の確認について
        </h2>
        <p className={sectionLead}>
          メーカーが記入した情報には「メーカー記入」と表示します。公式認証や製品の効果を保証するマークではありません。メーカーが内容の管理と責任を持ち、運営は原稿の整理・代筆を行いません。
        </p>
        <p className={featureBody}>
          掲載ポリシーの根拠は
          <a href={BS_GUIDELINE_URL} target="_blank" rel="noreferrer">
            {BS_GUIDELINE_TITLE}
          </a>
          です。効果・使用方法・安全性について、根拠を確認できる内容をご記入ください。画像やリンク・資料も公開前の表現確認の対象です。
        </p>
      </section>

      <section className={closing} aria-labelledby="manufacturer-apply-title">
        <h2 id="manufacturer-apply-title" className={closingTitle}>
          メーカーアカウントを申請する
        </h2>
        <p className={closingBody}>
          申請内容を確認し、ご登録の連絡先メールアドレスへご案内します。申請・掲載・編集は無料です。
        </p>
        <div className={closingActions}>
          <Link
            className={cx(buttonRecipe({ variant: "ghost", size: "md" }), closingPrimary)}
            href={applyHref}
          >
            申請フォームへ進む
          </Link>
          <Link
            className={cx(buttonRecipe({ variant: "ghost", size: "md" }), closingSecondary)}
            href="/sellers/login"
          >
            <span className={closingSecondaryLabel}>アカウントをお持ちの方はログイン</span>
          </Link>
        </div>
      </section>
    </>
  );
}
