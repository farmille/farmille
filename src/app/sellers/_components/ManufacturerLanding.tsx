import { Icon } from "@/components/Icon";
import Link from "next/link";

import { buttonRecipe } from "@/components";
import { css, cx } from "../../../../styled-system/css";

const hero = css({
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "green/25",
  borderRadius: "card",
  bg: "brand.soft",
  overflow: "hidden",
  lg: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
    alignItems: "stretch",
  },
});

const heroCopy = css({
  px: "4",
  py: "7",
  md: { px: "7", py: "9" },
  lg: { px: "9", py: "12" },
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

const audience = css({
  display: "flex",
  alignItems: "flex-start",
  gap: "2",
  mt: "4",
  mb: "0",
  color: "brand.primaryDeep",
  fontSize: "sm",
  fontWeight: "700",
  lineHeight: "relaxed",
});

const actions = css({
  display: "flex",
  flexDirection: "column",
  gap: "2.5",
  mt: "5",
  md: { flexDirection: "row", alignItems: "center" },
});

const actionButton = css({
  w: "100%",
  textAlign: "center",
  md: { w: "auto", minW: "52" },
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
  md: { px: "7" },
  lg: {
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
  md: { gridTemplateColumns: "1fr auto 1fr auto 1fr", alignItems: "center" },
  lg: { gridTemplateColumns: "1fr" },
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

const flowArrow = css({
  color: "text.subtle",
  fontSize: "lg",
  textAlign: "center",
  transform: "rotate(90deg)",
  md: { transform: "none" },
  lg: { transform: "rotate(90deg)" },
});

const section = css({
  mt: "10",
  md: { mt: "12" },
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
  md: { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" },
});

const featureCard = css({
  px: "4",
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

const policy = css({
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  gap: "3",
  mt: "10",
  px: "4",
  py: "4",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "blue/28",
  borderRadius: "card",
  bg: "blue/12",
});

const policyIcon = css({
  display: "grid",
  placeItems: "center",
  w: "9",
  h: "9",
  borderRadius: "pill",
  bg: "surface.card",
  color: "accent.official",
});

const policyTitle = css({
  m: "0",
  color: "text.default",
  fontSize: "md",
  fontWeight: "800",
});

const policyBody = css({
  mt: "1",
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
  md: { px: "7" },
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
  md: { flexDirection: "row", justifyContent: "center" },
});

const closingPrimary = css({
  w: "100%",
  bg: "surface.card",
  color: "brand.primaryDeep",
  md: { w: "auto", minW: "52" },
});

const closingSecondary = css({
  w: "100%",
  bg: "transparent",
  color: "surface.card",
  borderColor: "surface.card",
  md: { w: "auto", minW: "52" },
});

const closingSecondaryLabel = css({ color: "surface.card" });

export type ManufacturerLandingProps = {
  applyHref: "/sellers/apply" | "/sellers/apply?from=me";
};

const FEATURES = [
  {
    title: "自社資材をまとめて管理",
    body: "Farmilleに掲載済みの自社資材を確認し、未掲載の資材は追加を申請できます。",
  },
  {
    title: "正しい情報へ更新",
    body: "用途や成分、使い方などの変更を申請できます。運営の確認後に公開情報へ反映されます。",
  },
  {
    title: "根拠と記事を届ける",
    body: "カタログや試験資料などの根拠を管理し、メーカー名義の記事を公開できます。",
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
            Farmilleのメーカーアカウントでは、自社資材の追加・変更申請と、根拠資料や記事の管理ができます。
          </p>
          <p className={audience}>
            <Icon name="check" size="sm" />
            <span>利用できるのは、農業資材を製造するメーカーです。</span>
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
          <p className={approvalTitle}>申請した情報が公開されるまで</p>
          <div className={approvalFlow}>
            <div className={flowItem}>
              <span className={flowNumber}>1</span>
              メーカーが申請
            </div>
            <span className={flowArrow} aria-hidden>
              →
            </span>
            <div className={flowItem}>
              <span className={flowNumber}>2</span>
              運営が内容を確認
            </div>
            <span className={flowArrow} aria-hidden>
              →
            </span>
            <div className={flowItem}>
              <span className={flowNumber}>3</span>
              公開情報へ反映
            </div>
          </div>
        </div>
      </section>

      <section className={section} aria-labelledby="manufacturer-features-title">
        <h2 id="manufacturer-features-title" className={sectionHeading}>
          メーカーアカウントでできること
        </h2>
        <p className={sectionLead}>自社の資材情報を起点に、確認・申請・発信を一か所で行えます。</p>
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

      <aside className={policy} aria-labelledby="manufacturer-policy-title">
        <span className={policyIcon}>
          <Icon name="verified" size="md" />
        </span>
        <div>
          <h2 id="manufacturer-policy-title" className={policyTitle}>
            資材情報の正本は運営が管理します
          </h2>
          <p className={policyBody}>
            メーカーによる追加・変更・掲載終了は申請として保存され、運営が承認した内容だけが公開されます。既存情報をメーカーが確認すると、確認済みマークが表示されます。
          </p>
        </div>
      </aside>

      <section className={closing} aria-labelledby="manufacturer-apply-title">
        <h2 id="manufacturer-apply-title" className={closingTitle}>
          メーカーアカウントを申請する
        </h2>
        <p className={closingBody}>
          申請内容を運営が審査し、通常3営業日以内に連絡先メールアドレスへご案内します。
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
