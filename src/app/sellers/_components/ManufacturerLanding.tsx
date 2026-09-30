import Link from "next/link";

import { buttonRecipe } from "@/components";
import { Icon } from "@/components/Icon";
import {
  BS_GUIDELINE_TITLE,
  BS_GUIDELINE_URL,
  MANUFACTURER_ONBOARDING_STEPS,
} from "@/lib/manufacturer-policy";
import { APPLICATION_GUIDANCE, GUIDE_FAQS, MEMBER_ACTIONS } from "./manufacturer-guide";
import { css, cx } from "../../../../styled-system/css";

const hero = css({
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "primary.600/25",
  borderRadius: "card",
  bg: "primary.200",
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
  color: "primary.700",
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
  borderTopColor: "primary.600/25",
  tab: {
    px: "7",
    borderTopWidth: "0",
    borderLeftWidth: "1px",
    borderLeftStyle: "solid",
    borderLeftColor: "primary.600/25",
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

const section = css({
  scrollMarginTop: "24",
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
  bg: "primary.700",
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
  color: "primary.700",
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

const contents = [
  ["flow", "Farmille掲載までの流れ（初回5STEP）"],
  ["documents", "申請にご用意いただくもの"],
  ["guide", "ご利用ガイド（新規掲載・編集・終売申請）"],
  ["members", "企業会員登録済みの方の活用ガイド"],
  ["ownership", "資材オーナー権限とは？"],
  ["faq", "よくあるご質問"],
] as const;

const stack = css({ display: "grid", gap: "3", mt: "5" });
const list = css({
  pl: "5",
  mt: "3",
  mb: "0",
  display: "grid",
  gap: "2",
  fontSize: "sm",
  lineHeight: "relaxed",
  color: "text.muted",
});
const textLink = css({
  color: "primary.700",
  textDecoration: "underline",
  textUnderlineOffset: "0.2em",
  fontWeight: "700",
  overflowWrap: "anywhere",
});
const details = css({
  mt: "4",
  pt: "3",
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderColor: "border.default",
});
const summary = css({
  cursor: "pointer",
  color: "text.default",
  fontSize: "sm",
  fontWeight: "700",
  py: "2",
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.600",
    outlineOffset: "2px",
  },
});

type Guidance = (typeof APPLICATION_GUIDANCE)[keyof typeof APPLICATION_GUIDANCE];

function ApplicationDetails({ guidance }: { guidance: Guidance }) {
  return (
    <details className={details}>
      <summary className={summary}>対象となる企業様・ご準備いただくもの</summary>
      <h4 className={featureBody}>対象となる企業様</h4>
      <ul className={list}>
        {guidance.eligibility.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <h4 className={featureBody}>ご準備いただくもの</h4>
      <ul className={list}>
        {guidance.documents.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </details>
  );
}

export function ManufacturerLanding({ applyHref }: ManufacturerLandingProps) {
  const firstUseCases = [
    { title: "新しく資材を掲載したい", guidance: APPLICATION_GUIDANCE.registration },
    {
      title: "掲載されている自社資材の情報を確認・編集したい",
      guidance: APPLICATION_GUIDANCE.registration,
    },
  ];
  const stepLinks = [
    { href: applyHref, label: "企業会員登録を申請する" },
    {
      href: "/dashboard/applications/new/registration",
      label: "資材オーナー権限を申請する（フォームA）",
    },
    null,
    null,
    { href: "/dashboard/materials", label: "資材情報の管理へ進む" },
  ];
  return (
    <>
      <section className={hero} aria-labelledby="manufacturer-landing-title">
        <div className={heroCopy}>
          <span className={eyebrow}>
            <Icon name="check" size="sm" />
            メーカーの方へ
          </span>
          <h1 id="manufacturer-landing-title" className={title}>
            Farmille 企業様向け利用ガイド
          </h1>
          <h2 className={approvalTitle}>企業会員登録とは</h2>
          <p className={lead}>
            生産者により適切な資材情報を届けるため、各資材の製造元・販売元・輸入元にあたる企業の皆様に、企業会員登録をお願いしています。資材ごとに1社へ「資材オーナー権限」をお渡しし、製品説明・施用方法・資料などの更新と共有をお願いします。
          </p>
          <p className={sectionLead}>
            掲載済みの資材も、新しく掲載する資材も対象です。申請・掲載・編集は無料です。
          </p>
          <div className={actions}>
            <a
              className={cx(buttonRecipe({ variant: "primary", size: "md" }), actionButton)}
              href="#flow"
            >
              初めての方：掲載までの流れ
            </a>
            <Link
              className={cx(buttonRecipe({ variant: "ghost", size: "md" }), actionButton)}
              href="/sellers/login"
            >
              登録済みの方：ログイン
            </Link>
          </div>
        </div>
        <nav className={approvalPanel} aria-label="利用ガイドの目次">
          <p className={approvalTitle}>目次</p>
          <div className={approvalFlow}>
            {contents.map(([id, label]) => (
              <a className={flowItem} href={`#${id}`} key={id}>
                {label}
              </a>
            ))}
          </div>
        </nav>
      </section>

      <section id="flow" className={section} aria-labelledby="manufacturer-flow-title">
        <h2 id="manufacturer-flow-title" className={sectionHeading}>
          Farmille掲載までの流れ
        </h2>
        <p className={sectionLead}>
          必要書類をご確認のうえ、企業会員登録をご申請ください。登録済みの方はSTEP2からお進みください。確認事項がある場合は運営より連絡し、ご回答後に確認を再開します。
        </p>
        <div className={stack}>
          {MANUFACTURER_ONBOARDING_STEPS.map((step, index) => {
            const link = stepLinks[index];
            return (
              <article className={featureCard} key={step.title}>
                <p className={eyebrow}>
                  {index === 2 || index === 3 ? "Farmille側の作業" : "メーカー様の作業"}
                </p>
                <h3 className={featureTitle}>
                  STEP{index + 1}　{step.title}
                </h3>
                <p className={featureBody}>{step.body}</p>
                {link ? (
                  <p className={featureBody}>
                    <Link className={textLink} href={link.href}>
                      {link.label} →
                    </Link>
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section id="documents" className={section} aria-labelledby="manufacturer-documents-title">
        <h2 id="manufacturer-documents-title" className={sectionHeading}>
          申請にご用意いただくもの
        </h2>
        <p className={sectionLead}>
          パッケージ・ラベルの画像やPDF、またはパッケージを確認できる製品ページURLは、STEP2の申請フォームでご提出ください。
        </p>
        <div className={featureCard}>
          <ul className={list}>
            <li>
              資材ごとのパッケージ・ラベルの画像（貴社名の記載箇所を含む）、またはその画像を掲載した公式サイト・ECサイトの製品ページURL
            </li>
            <li>会社概要ページのURL</li>
            <li>
              法人番号（13桁）。
              <a
                className={textLink}
                href="https://www.houjin-bangou.nta.go.jp/"
                target="_blank"
                rel="noreferrer"
              >
                国税庁 法人番号公表サイト
              </a>
              で確認できます。
            </li>
            <li>担当者の氏名・部署・メールアドレス・電話番号（公開されません）</li>
          </ul>
          <h3 className={featureTitle}>資材オーナー権限の申請フォームに入力する項目</h3>
          <ul className={list}>
            <li>申請内容（新規掲載／掲載済み資材のオーナー権限）</li>
            <li>資材名（パッケージ記載の正式名称）</li>
            <li>掲載済み資材のFarmilleページURL</li>
            <li>資材との関係（製造元・販売元・輸入元）</li>
            <li>企業会員登録後に発行されるFarmilleアカウントID</li>
          </ul>
        </div>
      </section>

      <section id="guide" className={section} aria-labelledby="manufacturer-guide-title">
        <h2 id="manufacturer-guide-title" className={sectionHeading}>
          ご利用ガイド（新規掲載・編集・終売申請）
        </h2>
        <div className={featureGrid}>
          {firstUseCases.map((item) => (
            <article className={featureCard} key={item.title}>
              <p className={eyebrow}>ID必須</p>
              <h3 className={featureTitle}>{item.title}</h3>
              <ol className={list}>
                <li>
                  <Link className={textLink} href={applyHref}>
                    企業会員登録を申請
                  </Link>
                </li>
                <li>
                  <Link className={textLink} href="/dashboard/applications/new/registration">
                    資材オーナー権限を申請（フォームA）
                  </Link>
                </li>
                <li>
                  <Link className={textLink} href="/dashboard/materials">
                    資材情報を確認・編集
                  </Link>
                </li>
              </ol>
              <ApplicationDetails guidance={item.guidance} />
            </article>
          ))}
          <article className={featureCard}>
            <p className={eyebrow}>ID不要</p>
            <h3 className={featureTitle}>終売の反映・非表示にしたい</h3>
            <ol className={list}>
              <li>
                <Link className={textLink} href="/company-requests/removal">
                  受付フォームへ進む（フォームD）
                </Link>
              </li>
              <li>メールの確認用URLから申請フォームを開き、記入・提出</li>
            </ol>
            <ApplicationDetails guidance={APPLICATION_GUIDANCE.removal} />
          </article>
        </div>
      </section>

      <section id="members" className={section} aria-labelledby="manufacturer-members-title">
        <h2 id="manufacturer-members-title" className={sectionHeading}>
          企業会員登録済みの方の活用ガイド
        </h2>
        <div className={stack}>
          {MEMBER_ACTIONS.map((item, index) => (
            <article className={featureCard} key={item.title}>
              <h3 className={featureTitle}>
                <Link className={textLink} href={item.href}>
                  {index + 1}．{item.title} →
                </Link>
              </h3>
              <p className={featureBody}>{item.body}</p>
              {item.guidance ? <ApplicationDetails guidance={item.guidance} /> : null}
            </article>
          ))}
        </div>
      </section>

      <section id="ownership" className={section} aria-labelledby="manufacturer-policy-title">
        <h2 id="manufacturer-policy-title" className={sectionHeading}>
          資材オーナー権限とは？
        </h2>
        <p className={sectionLead}>
          Farmilleに掲載する資材ごとに1社に設定する権限で、資材情報の編集権限を含みます。製造元・販売元・輸入元の企業を対象に、パッケージの記載などで資材との関係を確認したうえでお渡しします。権限をお渡しした資材は、ダッシュボードから製品説明・施用方法・試験結果などを編集できます。
        </p>
        <p className={featureBody}>
          記入した情報には「メーカー記入」と表示します。公式認証や製品の効果を保証するマークではありません。メーカーが内容の管理と責任を持ち、運営は原稿の整理・代筆を行いません。公開前の表現確認と掲載後の監査を行います。
        </p>
        <p className={featureBody}>
          掲載ポリシーの根拠は
          <a className={textLink} href={BS_GUIDELINE_URL} target="_blank" rel="noreferrer">
            {BS_GUIDELINE_TITLE}
          </a>
          です。効果・使用方法・安全性について、根拠を確認できる内容をご記入ください。画像やリンク・資料も確認の対象です。
        </p>
        <p className={featureBody}>
          <Link className={textLink} href="/legal/manufacturer">
            メーカー会員規約
          </Link>
          と
          <Link className={textLink} href="/legal/advertising">
            資材ページ広告表現ガイドライン
          </Link>
          もご確認ください。
        </p>
      </section>

      <section id="faq" className={section} aria-labelledby="manufacturer-faq-title">
        <h2 id="manufacturer-faq-title" className={sectionHeading}>
          よくあるご質問
        </h2>
        <div className={stack}>
          {GUIDE_FAQS.map((faq) => (
            <article className={featureCard} key={faq.question}>
              <h3 className={featureTitle}>{faq.question}</h3>
              <p className={featureBody}>{faq.answer}</p>
              {faq.links.map((link) => (
                <p className={featureBody} key={link.href}>
                  <Link className={textLink} href={link.href}>
                    {link.label} →
                  </Link>
                </p>
              ))}
            </article>
          ))}
        </div>
      </section>
      <section className={section} aria-labelledby="manufacturer-contact-title">
        <h2 id="manufacturer-contact-title" className={sectionHeading}>
          お問い合わせ
        </h2>
        <p className={featureBody}>
          <a className={textLink} href="mailto:contact@farmille.com">
            contact@farmille.com
          </a>
        </p>
        <p className={sectionLead}>
          企業会員登録、資材オーナー権限、掲載内容に関するご質問・ご相談はメールで承ります。法人名・担当者名・対象資材の名称（掲載済みの場合はFarmilleページURL）をご記入ください。順次対応しますので、お返事までお時間をいただく場合があります。
        </p>
      </section>
      <section className={closing} aria-labelledby="manufacturer-apply-title">
        <h2 id="manufacturer-apply-title" className={closingTitle}>
          企業会員登録を申請する
        </h2>
        <p className={closingBody}>
          申請内容を確認し、ご登録のメールアドレスへアカウントIDとログインのご案内をお送りします。申請・掲載・編集は無料です。
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
