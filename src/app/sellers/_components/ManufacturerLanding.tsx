import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import heroPhoto from "@/app/_components/home-hero-rice-field.webp";
import {
  MANUFACTURER_ONBOARDING_STEPS,
  type ManufacturerOnboardingAction,
  type ManufacturerOnboardingActor,
} from "@/lib/manufacturer-policy";
import { css, cva, cx, sva } from "../../../../styled-system/css";

import { APPLICATION_GUIDANCE, GUIDE_FAQS, MEMBER_ACTIONS } from "./manufacturer-guide";

const CONTACT_EMAIL = "contact@farmille.com";
const OWNER_APPLICATION_HREF = "/dashboard/applications/new/registration";

/** 写真の上に白い膜を重ね、中央に見出しを置く。 */
const photoHero = css({
  position: "relative",
  display: "grid",
  placeItems: "center",
  minH: "230px",
  overflow: "hidden",
  textAlign: "center",
  tab: { minH: "320px" },
});

const photo = css({ objectFit: "cover", objectPosition: "center 40%" });

const photoVeil = css({
  position: "absolute",
  inset: "0",
  bgImage:
    "linear-gradient(180deg, color-mix(in srgb, {colors.card} 62%, transparent), color-mix(in srgb, {colors.card} 55%, transparent))",
});

const photoCopy = css({ position: "relative", px: "5", py: "8" });

const photoEyebrow = css({
  m: "0",
  color: "text.muted",
  fontSize: "xs",
  fontWeight: "800",
  letterSpacing: "0.28em",
});

const photoTitle = css({
  wordBreak: "auto-phrase",
  mt: "2.5",
  mb: "0",
  color: "text.default",
  fontSize: "hero",
  fontWeight: "800",
  lineHeight: "snug",
  letterSpacing: "0.02em",
  pc: { fontSize: "display" },
});

const body = css({ px: "4", tab: { px: "5" } });

const band = css({
  wordBreak: "auto-phrase",
  mt: "4.5",
  mb: "0",
  px: "4",
  py: "3",
  borderLeftWidth: "5px",
  borderLeftStyle: "solid",
  borderLeftColor: "primary.600",
  bg: "primary.soft",
  color: "text.default",
  fontSize: "2xl",
  fontWeight: "800",
  lineHeight: "snug",
  tab: { fontSize: "3xl" },
});

const lead = css({
  mt: "4",
  mb: "0",
  color: "text.muted",
  fontSize: "md",
  lineHeight: "loose",
});

const highlight = css({ color: "primary.700", fontWeight: "800" });

const choices = css({
  display: "flex",
  flexDirection: "column",
  gap: "3",
  mt: "5",
  tab: { flexDirection: "row", maxW: "content.medium", mx: "auto" },
});

const choice = sva({
  slots: ["root", "note"],
  base: {
    root: {
      flex: "1",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      px: "4",
      py: "4.5",
      borderWidth: "1.5px",
      borderStyle: "solid",
      borderColor: "primary.600",
      borderRadius: "button",
      fontSize: "lg",
      fontWeight: "800",
      lineHeight: "normal",
      textAlign: "center",
      textDecoration: "none",
      transition: "background-color {durations.fast} {easings.soft}",
    },
    note: { fontSize: "sm", fontWeight: "500", opacity: "0.92" },
  },
  variants: {
    tone: {
      primary: {
        root: { bg: "primary.600", color: "surface.card", _hover: { bg: "primary.700" } },
      },
      secondary: {
        root: { bg: "surface.card", color: "primary.700" },
      },
    },
  },
});

const card = css({
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "button",
  bg: "surface.card",
});

const toc = css({ mt: "4.5", px: "4.5", py: "3.5" });

const tocTitle = css({
  m: "0",
  mb: "1.5",
  color: "text.subtle",
  fontSize: "sm",
  fontWeight: "800",
  letterSpacing: "0.06em",
});

const plainList = css({ m: "0", p: "0", listStyle: "none" });

const tocLink = css({
  display: "block",
  py: "1",
  color: "primary.700",
  fontSize: "md",
  fontWeight: "700",
  textDecoration: "none",
  _before: { content: '"›"', mr: "2", color: "text.subtle" },
  _hover: { textDecoration: "underline" },
});

const sectionBlock = css({ mt: "9", tab: { mt: "11" } });

const sectionEyebrow = css({
  mt: "0",
  mb: "1.5",
  color: "primary.700",
  fontSize: "xs",
  fontWeight: "800",
  letterSpacing: "0.06em",
});

const sectionHeading = css({
  wordBreak: "auto-phrase",
  m: "0",
  color: "text.default",
  fontSize: "2xl",
  fontWeight: "800",
  lineHeight: "snug",
  scrollMarginTop: "24",
  tab: { fontSize: "3xl" },
});

const sectionLead = css({
  mt: "1.5",
  mb: "0",
  color: "text.muted",
  fontSize: "sm",
  lineHeight: "relaxed",
  "& b": { color: "text.default" },
});

const timeline = css({ mt: "4", px: "3.5", pt: "4", pb: "3.5", overflowX: "auto" });

const legend = css({
  display: "flex",
  justifyContent: "center",
  gap: "4.5",
  mb: "3",
  fontSize: "sm",
  fontWeight: "800",
});

const legendItem = sva({
  slots: ["root", "swatch"],
  base: {
    root: { display: "inline-flex", alignItems: "center", gap: "1.5" },
    swatch: { w: "12px", h: "12px", flex: "0 0 auto" },
  },
  variants: {
    actor: {
      maker: { root: { color: "tag.effect" }, swatch: { bg: "tag.effect" } },
      farmille: {
        root: { color: "primary.700" },
        swatch: {
          bg: "surface.card",
          borderWidth: "1.5px",
          borderStyle: "solid",
          borderColor: "primary.700",
        },
      },
    },
  },
});

const chevronSteps = css({
  display: "flex",
  gap: "1",
  minW: "640px",
  m: "0",
  p: "0",
  listStyle: "none",
});

const chevronStep = css({ flex: "1", textAlign: "center" });

const CHEVRON_CLIP =
  "polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 10px 50%)";
const CHEVRON_CLIP_FIRST =
  "polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)";

/** Farmille 側の工程は、同じ形の白い面を 1.5px 内側に重ねて輪郭だけを残す。 */
const chevron = cva({
  base: {
    position: "relative",
    display: "block",
    px: "1",
    py: "1.5",
    fontSize: "xs",
    fontWeight: "800",
    clipPath: CHEVRON_CLIP,
    "li:first-child > &": { clipPath: CHEVRON_CLIP_FIRST },
  },
  variants: {
    actor: {
      maker: { bg: "tag.effect", color: "surface.card" },
      farmille: {
        bg: "primary.700",
        color: "primary.700",
        _before: {
          content: '""',
          position: "absolute",
          inset: "1.5px",
          bg: "surface.card",
          clipPath: CHEVRON_CLIP,
        },
        "li:first-child > &::before": { clipPath: CHEVRON_CLIP_FIRST },
      },
    },
  },
});

const chevronLabel = css({ position: "relative" });

const chevronCaption = css({
  mt: "2",
  mb: "0",
  color: "text.default",
  fontSize: "xs",
  fontWeight: "700",
  lineHeight: "normal",
});

const timelineNote = css({
  mt: "3",
  mb: "0",
  px: "3",
  py: "2.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "primary.600",
  borderRadius: "input",
  bg: "primary.soft",
  color: "text.muted",
  fontSize: "sm",
  lineHeight: "relaxed",
});

const stepCard = sva({
  slots: ["root", "badge", "body"],
  base: {
    root: { mt: "3", px: "4.5", py: "4" },
    badge: {
      display: "inline-block",
      m: "0",
      px: "2.5",
      py: "0.5",
      borderRadius: "pill",
      fontSize: "xs",
      fontWeight: "800",
      letterSpacing: "0.06em",
    },
    body: { mt: "1.5", mb: "0", fontSize: "sm", lineHeight: "loose" },
  },
  variants: {
    actor: {
      maker: {
        badge: { bg: "tag.effect", color: "surface.card" },
        body: { color: "text.muted" },
      },
      farmille: {
        root: { borderStyle: "dashed", borderColor: "primary.700", bg: "surface.page" },
        badge: {
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "border.strong",
          bg: "surface.card",
          color: "text.muted",
        },
        body: { color: "text.subtle" },
      },
    },
  },
});

const underlineLink = css({
  color: "primary.700",
  fontWeight: "700",
  textDecoration: "underline",
  textUnderlineOffset: "3px",
  overflowWrap: "anywhere",
});

const stepLink = css({ display: "inline-flex", mt: "2.5", fontSize: "md" });

const prepCard = css({ mt: "3", px: "4.5", py: "4" });

const prepTitle = css({
  wordBreak: "auto-phrase",
  m: "0",
  mb: "2",
  color: "primary.700",
  fontSize: "md",
  fontWeight: "800",
});

const prepList = css({
  m: "0",
  listStyleType: "decimal",
  pl: "1.4em",
  color: "text.muted",
  fontSize: "md",
  lineHeight: "loose",
  "& b": { color: "text.default" },
});

const guideGrid = css({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "3.5",
  mt: "3.5",
  pc: { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" },
});

const guideCard = cva({
  base: { px: "4.5", py: "3.5", scrollMarginTop: "24" },
  variants: { wide: { true: { pc: { gridColumn: "1 / -1" } }, false: {} } },
  defaultVariants: { wide: false },
});

const guideTitle = css({
  wordBreak: "auto-phrase",
  m: "0",
  pl: "2.5",
  borderLeftWidth: "3px",
  borderLeftStyle: "solid",
  borderLeftColor: "primary.600",
  color: "text.default",
  fontSize: "md",
  fontWeight: "800",
  lineHeight: "snug",
});

const idBadge = cva({
  base: {
    display: "inline-block",
    ml: "2.5",
    px: "2",
    py: "0.5",
    borderRadius: "pill",
    fontSize: "xs",
    fontWeight: "700",
    whiteSpace: "nowrap",
    verticalAlign: "0.1em",
  },
  variants: {
    required: {
      true: { bg: "amber.soft", color: "accent.warn" },
      false: {
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border.strong",
        bg: "surface.page",
        color: "text.muted",
      },
    },
  },
});

const guideSteps = css({
  mt: "2.5",
  mb: "0",
  p: "0",
  listStyle: "none",
  counterReset: "guide",
});

const guideStep = cva({
  base: { py: "1", fontSize: "md", lineHeight: "relaxed" },
  variants: {
    numbered: {
      true: {
        counterIncrement: "guide",
        _before: {
          content: 'counter(guide) "．"',
          display: "inline-block",
          minW: "1.6em",
          color: "text.subtle",
          fontWeight: "800",
        },
      },
      false: { pl: "2.2em", color: "text.muted" },
    },
  },
});

const details = sva({
  slots: ["root", "summary", "panels", "panel", "panelTitle", "panelList"],
  base: {
    summary: {
      display: "flex",
      alignItems: "center",
      gap: "2.5",
      fontWeight: "700",
      cursor: "pointer",
      listStyle: "none",
      "&::-webkit-details-marker": { display: "none" },
      _before: {
        content: '""',
        w: "6px",
        h: "6px",
        ml: "0.5",
        borderStyle: "solid",
        borderColor: "currentColor",
        borderTopWidth: "0",
        borderLeftWidth: "0",
        borderRightWidth: "2px",
        borderBottomWidth: "2px",
        transform: "rotate(-45deg)",
        transition: "transform {durations.fast} {easings.soft}",
      },
      "details[open] > &": { _before: { transform: "rotate(45deg)" } },
    },
    panels: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: "3",
      mt: "3",
      pb: "1",
      tab: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
    },
    panel: {
      px: "3.5",
      py: "3",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: "border.default",
      borderRadius: "input",
      bg: "surface.page",
    },
    panelTitle: { m: "0", mb: "1.5", color: "primary.700", fontSize: "sm", fontWeight: "800" },
    panelList: {
      m: "0",
      listStyleType: "disc",
      pl: "1.2em",
      color: "text.muted",
      fontSize: "sm",
      lineHeight: "relaxed",
      "& li + li": { mt: "1" },
    },
  },
  variants: {
    inline: {
      true: {
        root: { mt: "0.5", mb: "1.5", ml: "2.2em" },
        summary: {
          py: "0.5",
          color: "text.muted",
          fontSize: "sm",
          fontWeight: "600",
          "details[open] > &": { color: "primary.700" },
        },
        panels: { mt: "2" },
      },
      false: {
        root: {
          mt: "3",
          borderTopWidth: "1px",
          borderTopStyle: "solid",
          borderTopColor: "border.default",
        },
        summary: { pt: "2.5", pb: "0.5", color: "primary.700", fontSize: "md" },
      },
    },
  },
});

const ownerCard = css({
  mt: "3.5",
  px: "5",
  py: "4",
  "& p": { m: "0", color: "text.default", fontSize: "md", lineHeight: "relaxed" },
});

const faqList = css({ mt: "3.5", overflow: "hidden" });

const faqItem = css({
  px: "4.5",
  py: "4",
  "& + &": {
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "border.default",
  },
});

const faqQuestion = css({
  wordBreak: "auto-phrase",
  display: "flex",
  gap: "2.5",
  m: "0",
  color: "text.default",
  fontSize: "md",
  fontWeight: "800",
  lineHeight: "normal",
  _before: { content: '"Q"', flex: "0 0 auto", color: "primary.600" },
});

const faqAnswer = css({
  position: "relative",
  mt: "2",
  pl: "6",
  color: "text.muted",
  fontSize: "md",
  lineHeight: "loose",
});

const faqAnswerMark = css({
  position: "absolute",
  left: "0.5",
  top: "0",
  color: "text.subtle",
  fontWeight: "800",
});

const faqAnswerText = css({ m: "0" });

const faqLink = css({ display: "block", mt: "1.5" });

const contact = css({ mt: "6", px: "5", py: "4.5", tab: { px: "6.5" } });

const contactTitle = css({ m: "0", color: "text.default", fontSize: "md", fontWeight: "800" });

const contactMail = css({
  display: "inline-block",
  mt: "1",
  color: "primary.700",
  fontSize: "xl",
  fontWeight: "800",
  letterSpacing: "0.01em",
  textDecoration: "none",
  wordBreak: "break-all",
  _hover: { textDecoration: "underline" },
});

const contactBody = css({
  mt: "2",
  mb: "0",
  color: "text.muted",
  fontSize: "sm",
  lineHeight: "relaxed",
});

const closing = css({
  mt: "9",
  px: "5",
  py: "7",
  borderRadius: "card",
  bg: "primary.600",
  color: "surface.card",
  textAlign: "center",
  tab: { px: "8", py: "9" },
});

const closingTitle = css({
  wordBreak: "auto-phrase",
  m: "0",
  fontSize: "xl",
  fontWeight: "800",
  tab: { fontSize: "2xl" },
});

const closingBody = css({
  mt: "2",
  mb: "0",
  fontSize: "sm",
  lineHeight: "loose",
  opacity: "0.95",
});

const closingActions = css({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "2.5",
  mt: "4.5",
});

const closingButton = css({
  px: "6",
  py: "3",
  minW: "button.md",
  maxW: "100%",
  textAlign: "center",
  overflowWrap: "anywhere",
  borderRadius: "button",
  bg: "surface.card",
  color: "primary.700",
  fontSize: "md",
  fontWeight: "800",
  textDecoration: "none",
  transition: "background-color {durations.fast} {easings.soft}",
  _hover: { bg: "primary.soft" },
});

const CONTENTS = [
  ["flow", "Farmille掲載までの流れ（初回5STEP）"],
  ["documents", "申請にご用意いただくもの"],
  ["guide", "ご利用ガイド（新規掲載・編集・終売申請）"],
  ["faq", "よくあるご質問"],
  ["ownership", "資材オーナー権限とは？"],
] as const;

const OWNER_GUIDES = [
  { id: "guide-new", title: "新しく資材を掲載したい" },
  { id: "guide-existing", title: "掲載されている自社資材の情報を確認・編集したい" },
] as const;

export type ManufacturerLandingProps = { applyHref: "/sellers/apply" | "/sellers/apply?from=me" };

export function ManufacturerLanding({ applyHref }: ManufacturerLandingProps) {
  const stepLinks = {
    register: { href: applyHref, label: "企業会員登録の申請はこちらから →" },
    ownerApplication: { href: OWNER_APPLICATION_HREF, label: "申請フォームはこちらから →" },
    dashboard: { href: "/dashboard", label: "企業会員ダッシュボードはこちらから →" },
  } as const satisfies Record<ManufacturerOnboardingAction, { href: string; label: string }>;

  return (
    <>
      <section className={photoHero} aria-labelledby="manufacturer-landing-title">
        <Image
          alt=""
          className={photo}
          fill
          priority
          sizes="(min-width: 1200px) 1200px, 100vw"
          src={heroPhoto}
        />
        <div aria-hidden className={photoVeil} />
        <div className={photoCopy}>
          <p className={photoEyebrow}>FOR BUSINESS</p>
          <h1 id="manufacturer-landing-title" className={photoTitle}>
            Farmille 企業様向け利用ガイド
          </h1>
        </div>
      </section>

      <div className={body}>
        <section aria-labelledby="membership-title">
          <h2 id="membership-title" className={band}>
            企業会員登録とは
          </h2>
          <p className={lead}>
            Farmilleでは、生産者により適切な資材情報を届けるために、各資材の製造元・販売元・輸入元にあたるメーカー様に、企業会員のご登録をお願いしています。ご登録いただいた企業様に、資材ごとに
            <b className={highlight}>
              「資材オーナー権限」（資材ごとに1社に設定する権限で、資材情報の編集権限を含みます）
            </b>
            をお渡しし、製品説明・施用方法・資料などの情報の更新と共有をお願いいたします。すでにFarmilleに掲載されている資材も、これから掲載する資材も対象で、
            <b className={highlight}>申請・掲載・編集は無料です。</b>
          </p>
          <div className={choices}>
            <ChoiceLink
              href="#flow"
              note="掲載までの流れを見る"
              title="初めての方"
              tone="primary"
            />
            <ChoiceLink
              href="/sellers/login"
              note="企業会員ダッシュボードにログイン"
              title="企業会員登録済みの方"
              tone="secondary"
            />
          </div>
        </section>

        <nav aria-label="利用ガイドの目次" className={cx(card, toc)}>
          <p className={tocTitle}>目次</p>
          <ul className={plainList}>
            {CONTENTS.map(([id, label]) => (
              <li key={id}>
                <a className={tocLink} href={`#${id}`}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <section className={sectionBlock} aria-labelledby="flow">
          <p className={sectionEyebrow}>初めてFarmilleに資材を掲載いただくメーカー様向け</p>
          <h2 id="flow" className={sectionHeading}>
            Farmille掲載までの流れ
          </h2>
          <p className={sectionLead}>
            <b>
              企業会員登録と企業会員ダッシュボードから、資材掲載に関わる申請を行っていただけます。
            </b>
            <br />
            まずは必要書類をご確認いただき、企業会員登録の申請をお願いいたします。
            <br />
            ※企業会員登録済みの方はSTEP2からお進みください。
          </p>

          <div className={cx(card, timeline)}>
            <div className={legend}>
              <LegendItem actor="maker" label="メーカー様作業" />
              <LegendItem actor="farmille" label="Farmille側作業" />
            </div>
            <ol className={chevronSteps} aria-label="掲載までの5ステップ">
              {MANUFACTURER_ONBOARDING_STEPS.map((step, index) => (
                <li className={chevronStep} key={step.title}>
                  <span className={chevron({ actor: step.actor })}>
                    <span className={chevronLabel}>STEP{index + 1}</span>
                  </span>
                  <p className={chevronCaption}>{step.title}</p>
                </li>
              ))}
            </ol>
            <p className={timelineNote}>
              内容について運営より連絡を差し上げる場合があります。ご回答をいただいた後に確認作業を再開しますのでご了承ください。
            </p>
          </div>

          {MANUFACTURER_ONBOARDING_STEPS.map((step, index) => {
            const styles = stepCard({ actor: step.actor });
            const target = step.action === null ? null : stepLinks[step.action];
            return (
              <article className={cx(card, styles.root)} key={step.title}>
                <h3 className={styles.badge}>
                  STEP{index + 1}　{step.title}
                </h3>
                <p className={styles.body}>{step.body}</p>
                {target === null ? null : (
                  <Link className={cx(underlineLink, stepLink)} href={target.href}>
                    {target.label}
                  </Link>
                )}
              </article>
            );
          })}
        </section>

        <section className={sectionBlock} aria-labelledby="documents">
          <h2 id="documents" className={sectionHeading}>
            申請にご用意いただくもの
          </h2>
          <p className={sectionLead}>
            企業会員登録と資材オーナー権限の申請にあたり、下記のご準備をお願いします。パッケージ・ラベルの画像またはPDFの添付、あるいはパッケージが確認できる製品ページURLのご提示は、STEP2の申請フォームで行います。
          </p>
          <div className={cx(card, prepCard)}>
            <h3 className={prepTitle}>ご用意いただくもの</h3>
            <ol className={prepList}>
              <li>
                <b>資材ごとのパッケージ・ラベルの画像</b>
                （貴社名の記載箇所を含む。当該資材との関係確認のため）。または、パッケージ画像が掲載されている公式サイト・ECサイトの製品ページURL
              </li>
              <li>
                <b>会社概要ページのURL</b>（申請元確認のため）
              </li>
              <li>
                <b>法人番号（13桁）</b>。
                <a
                  className={underlineLink}
                  href="https://www.houjin-bangou.nta.go.jp/"
                  target="_blank"
                  rel="noreferrer"
                >
                  国税庁 法人番号公表サイト
                </a>
                で確認できます
              </li>
              <li>
                <b>ご担当者の氏名・部署・メールアドレス・電話番号</b>（公開されません）
              </li>
            </ol>
          </div>
          <div className={cx(card, prepCard)}>
            <h3 className={prepTitle}>資材オーナー権限の申請フォームにご入力いただく項目</h3>
            <ol className={prepList}>
              <li>申請内容（資材情報の新規掲載／掲載済み資材の資材オーナー権限）</li>
              <li>資材名（パッケージ記載の正式名称）</li>
              <li>FarmilleページURL（掲載済み資材の場合）</li>
              <li>当該資材との関係（製造元・販売元・輸入元）</li>
              <li>FarmilleアカウントID（企業会員登録後に運営が発行します）</li>
            </ol>
          </div>
        </section>

        <section className={sectionBlock} aria-labelledby="guide">
          <h2 id="guide" className={sectionHeading}>
            ご利用ガイド（新規掲載・編集・終売申請）
          </h2>
          <div className={guideGrid}>
            {OWNER_GUIDES.map((item) => (
              <article id={item.id} key={item.id} className={cx(card, guideCard())}>
                <h3 className={guideTitle}>
                  {item.title}
                  <span className={idBadge({ required: true })}>ID必須</span>
                </h3>
                <ol className={guideSteps}>
                  <GuideStep>
                    <Link className={underlineLink} href={applyHref}>
                      企業会員登録の申請
                    </Link>
                  </GuideStep>
                  <GuideStep>
                    <Link className={underlineLink} href={OWNER_APPLICATION_HREF}>
                      資材オーナー権限の申請フォーム
                    </Link>
                  </GuideStep>
                  <GuideStep>
                    <Link className={underlineLink} href="/dashboard/materials">
                      資材情報の確認・編集
                    </Link>
                    （企業会員ダッシュボードから）
                  </GuideStep>
                </ol>
                <ApplicationDetails guidance={APPLICATION_GUIDANCE.registration} inline={false} />
              </article>
            ))}
            <article id="guide-removal" className={cx(card, guideCard())}>
              <h3 className={guideTitle}>
                終売の反映・非表示にしたい
                <span className={idBadge({ required: false })}>ID不要</span>
              </h3>
              <ol className={guideSteps}>
                <GuideStep>
                  <Link className={underlineLink} href="/company-requests/removal">
                    受付フォームにご記入
                  </Link>
                  （申請用フォームを送付いたします）
                </GuideStep>
                <GuideStep>申請フォームにご記入・ご提出（メールに記載のURLから開きます）</GuideStep>
              </ol>
              <ApplicationDetails guidance={APPLICATION_GUIDANCE.removal} inline={false} />
            </article>
            <section
              id="members"
              className={cx(card, guideCard({ wide: true }))}
              aria-labelledby="members-title"
            >
              <h3 id="members-title" className={guideTitle}>
                企業会員登録済みの方の活用ガイド
              </h3>
              <ol className={guideSteps}>
                {MEMBER_ACTIONS.map((item, index) => (
                  <MemberAction key={item.title} item={item} showProvisional={index === 1} />
                ))}
              </ol>
            </section>
          </div>
        </section>

        <section className={sectionBlock} aria-labelledby="ownership">
          <h2 id="ownership" className={sectionHeading}>
            資材オーナー権限とは？
          </h2>
          <div className={cx(card, ownerCard)}>
            <p>
              Farmilleに掲載される資材ごとに1社に設定する権限で、資材情報の編集権限を含みます。当該資材の製造元・販売元・輸入元の企業様を対象に、パッケージの記載で貴社と資材の関係を確認したうえでお渡しします。権限をお渡しした資材は、企業会員ダッシュボードから製品説明・施用方法・試験結果などの情報を編集できます。
            </p>
          </div>
        </section>

        <section className={sectionBlock} aria-labelledby="faq">
          <h2 id="faq" className={sectionHeading}>
            よくあるご質問
          </h2>
          <div className={cx(card, faqList)}>
            {GUIDE_FAQS.map((faq) => (
              <article className={faqItem} key={faq.question}>
                <h3 className={faqQuestion}>{faq.question}</h3>
                <div className={faqAnswer}>
                  <span aria-hidden className={faqAnswerMark}>
                    A
                  </span>
                  <p className={faqAnswerText}>{faq.answer}</p>
                  {faq.links.map((target) => (
                    <a className={cx(underlineLink, faqLink)} href={target.href} key={target.href}>
                      {target.label} →
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={cx(card, contact)} aria-labelledby="manufacturer-contact-title">
          <h2 id="manufacturer-contact-title" className={contactTitle}>
            お問い合わせ
          </h2>
          <a className={contactMail} href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          <p className={contactBody}>
            企業会員登録、資材オーナー権限、資材ページの掲載内容に関するご質問・ご相談はメールで承ります。
            <br />
            お問い合わせの際は、法人名・ご担当者名・対象資材の名称（掲載済みの場合はFarmilleページのURL）をご記入ください。いただいたご連絡には順次対応いたしますので、お返事までお時間をいただく場合がございます。
          </p>
        </section>

        <section className={closing} aria-labelledby="manufacturer-apply-title">
          <h2 id="manufacturer-apply-title" className={closingTitle}>
            企業会員登録を申請する
          </h2>
          <p className={closingBody}>
            申請内容を確認し、ご登録のメールアドレスへFarmilleアカウントIDとログインのご案内をお送りします。
            <b>申請・掲載・編集は無料です。</b>
          </p>
          <div className={closingActions}>
            <Link className={closingButton} href={applyHref}>
              申請フォームへ進む
            </Link>
            <Link className={closingButton} href="/sellers/login">
              アカウントをお持ちの方はログイン
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

type ChoiceLinkProps = {
  href: string;
  title: string;
  note: string;
  tone: "primary" | "secondary";
};

function ChoiceLink({ href, title, note, tone }: ChoiceLinkProps) {
  const styles = choice({ tone });
  return (
    <Link className={styles.root} href={href}>
      {title}
      <small className={styles.note}>{note}</small>
    </Link>
  );
}

function LegendItem({ actor, label }: { actor: ManufacturerOnboardingActor; label: string }) {
  const styles = legendItem({ actor });
  return (
    <span className={styles.root}>
      <span aria-hidden className={styles.swatch} />
      {label}
    </span>
  );
}

function GuideStep({ children }: { children: ReactNode }) {
  return <li className={guideStep({ numbered: true })}>{children}</li>;
}

type MemberActionProps = {
  item: (typeof MEMBER_ACTIONS)[number];
  showProvisional: boolean;
};

function MemberAction({ item, showProvisional }: MemberActionProps) {
  return (
    <>
      <GuideStep>
        <Link className={underlineLink} href={item.href}>
          {item.title}
        </Link>
        {item.guidance === null ? null : <ApplicationDetails guidance={item.guidance} inline />}
      </GuideStep>
      {showProvisional ? (
        <li className={guideStep({ numbered: false })}>
          ┗{" "}
          <Link className={underlineLink} href={OWNER_APPLICATION_HREF}>
            仮掲載ページの情報を確認・編集する
          </Link>
          （資材オーナー権限の申請）
        </li>
      ) : null}
    </>
  );
}

type Guidance = (typeof APPLICATION_GUIDANCE)[keyof typeof APPLICATION_GUIDANCE];

function ApplicationDetails({ guidance, inline }: { guidance: Guidance; inline: boolean }) {
  const styles = details({ inline });
  return (
    <details className={styles.root}>
      <summary className={styles.summary}>対象となる企業様・ご準備いただくもの</summary>
      <div className={styles.panels}>
        <div className={styles.panel}>
          <h4 className={styles.panelTitle}>対象となる企業様</h4>
          <ul className={styles.panelList}>
            {guidance.eligibility.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </div>
        <div className={styles.panel}>
          <h4 className={styles.panelTitle}>ご準備いただくもの</h4>
          <ul className={styles.panelList}>
            {guidance.documents.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}
