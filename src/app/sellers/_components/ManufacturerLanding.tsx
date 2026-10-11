import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import heroPhoto from "@/app/_components/home-hero-rice-field.webp";
import { Badge } from "@/components/Badge";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/Collapsible";
import {
  MANUFACTURER_ONBOARDING_STEPS,
  type ManufacturerOnboardingAction,
} from "@/lib/manufacturer-policy";

import { css, cva, cx } from "../../../../styled-system/css";
import {
  guideBoxStyle,
  guideCardStyle,
  guideEyebrowHeadingStyle,
  guideHeadingStyle,
  guideLinkStyle,
  guidePageStyle,
  guideSubStyle,
  questionStyle,
  stepBodyRecipe,
  stepCardRecipe,
  stepLabelRecipe,
  stepLinkStyle,
} from "./guide-styles";
import {
  CONTACT_EMAIL,
  GUIDE_FAQS,
  MEMBER_ACTIONS,
  OWNER_APPLICATION_HREF,
  PROCEDURES,
  type ProcedureSlug,
} from "./manufacturer-guide";

const CONTENTS = [
  ["lpFlow", "Farmille掲載までの流れ（初回5STEP）"],
  ["lpPrep", "申請にご用意いただくもの"],
  ["lpGuide", "ご利用ガイド（新規掲載・編集・終売のご依頼）"],
  ["lpFaq", "よくあるご質問"],
  ["lpOwner", "資材オーナー権限とは？"],
] as const;

const OWNER_GUIDES = [
  { id: "lpGuideNew", title: "新しく資材を掲載したい" },
  { id: "lpGuideExisting", title: "掲載されている自社資材の情報を確認・編集したい" },
] as const;

const highlightStyle = css({ color: "primary.800", fontWeight: "extrabold" });

const entryLinkRecipe = cva({
  base: {
    flex: "1",
    display: "block",
    py: "4.5",
    px: "4",
    borderRadius: "button",
    fontSize: "lg",
    fontWeight: "extrabold",
    lineHeight: "normal",
    textAlign: "center",
    textDecoration: "none",
    "& small": { display: "block", fontSize: "sm", fontWeight: "medium" },
  },
  variants: {
    tone: {
      primary: { bg: "primary.700", color: "text.inverse" },
      outline: {
        bg: "surface.card",
        color: "primary.800",
        borderWidth: "1.5px",
        borderStyle: "solid",
        borderColor: "primary.700",
      },
    },
  },
});

const timelineClip =
  "polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 10px 50%)";

const chevronRecipe = cva({
  base: {
    position: "relative",
    display: "block",
    py: "2",
    px: "1",
    fontSize: "xs",
    fontWeight: "extrabold",
    clipPath: timelineClip,
  },
  variants: {
    actor: {
      maker: { bg: "accent.manufacturer", color: "text.inverse" },
      farmille: {
        bg: "primary.800",
        color: "primary.800",
        _before: {
          content: '""',
          position: "absolute",
          inset: "1.5px",
          bg: "surface.card",
          clipPath: timelineClip,
        },
        "& b": { position: "relative" },
      },
    },
    first: {
      true: {
        clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)",
      },
      false: {},
    },
  },
});

const legendSwatchRecipe = cva({
  base: {
    display: "inline-block",
    w: "3",
    h: "3",
    mr: "1.5",
    borderRadius: "mark",
    verticalAlign: "-1px",
  },
  variants: {
    actor: {
      maker: { bg: "accent.manufacturer" },
      farmille: {
        bg: "surface.card",
        borderWidth: "1.5px",
        borderStyle: "solid",
        borderColor: "primary.800",
      },
    },
  },
});

const guideListStyle = css({
  mt: "2.5",
  "& li": { py: "1", textStyle: "prose" },
  "& li a": {
    color: "primary.800",
    fontWeight: "bold",
    textDecoration: "underline",
    textUnderlineOffset: "3px",
  },
});

const listNumberStyle = css({
  display: "inline-block",
  minW: "5",
  fontWeight: "extrabold",
  color: "text.subtle",
});

export type ManufacturerLandingProps = { applyHref: "/sellers/apply" | "/sellers/apply?from=me" };

export function ManufacturerLanding({ applyHref }: ManufacturerLandingProps) {
  const stepLinks = {
    register: { href: applyHref, label: "企業会員登録の申請はこちらから →" },
    ownerApplication: { href: OWNER_APPLICATION_HREF, label: "申請フォームはこちらから →" },
    dashboard: { href: "/dashboard", label: "企業会員ダッシュボードはこちらから →" },
  } as const satisfies Record<ManufacturerOnboardingAction, { href: string; label: string }>;

  return (
    <div className={guidePageStyle}>
      <div
        className={css({
          position: "relative",
          display: "grid",
          placeItems: "center",
          minH: "56",
          mx: "-4",
          mt: "-4",
          overflow: "hidden",
          textAlign: "center",
          pc: { minH: "80" },
          _before: {
            content: '""',
            position: "absolute",
            inset: "0",
            zIndex: "1",
            bg: "surface.card/60",
          },
        })}
      >
        <div
          aria-hidden="true"
          className={css({
            position: "absolute",
            inset: "0",
            "& img": { objectFit: "cover", objectPosition: "center 40%" },
          })}
        >
          <Image alt="" fill priority sizes="100vw" src={heroPhoto} />
        </div>
        <div className={css({ position: "relative", zIndex: "2", py: "8", px: "5" })}>
          <div
            className={css({
              fontSize: "xs",
              fontWeight: "extrabold",
              letterSpacing: "0.28em",
              color: "text.muted",
            })}
          >
            FOR BUSINESS
          </div>
          <h1
            className={css({
              mt: "2.5",
              fontSize: "3xl",
              lineHeight: "snug",
              letterSpacing: "0.02em",
              color: "text.default",
              pc: { fontSize: "display" },
            })}
          >
            Farmille 企業様向け利用ガイド
          </h1>
        </div>
      </div>

      <section aria-labelledby="lpAbout">
        <h2
          id="lpAbout"
          className={css({
            mt: "4.5",
            py: "3",
            px: "4",
            bg: "primary.soft",
            borderLeftWidth: "5px",
            borderLeftStyle: "solid",
            borderLeftColor: "primary.700",
            fontSize: "xl",
            fontWeight: "extrabold",
            lineHeight: "snug",
            pc: { fontSize: "3xl" },
          })}
        >
          企業会員登録とは
        </h2>
        <p className={css({ mt: "4", fontSize: "md", lineHeight: "loose", color: "text.muted" })}>
          Farmilleでは、生産者により適切な資材情報を届けるために、各資材の製造元・販売元・輸入元にあたるメーカー様に、企業会員のご登録をお願いしています。ご登録いただいた企業様に、資材ごとに
          <b className={highlightStyle}>
            「資材オーナー権限」（資材ごとに1社に設定する権限で、資材情報の編集権限を含みます）
          </b>
          をお渡しし、製品説明・施用方法・資料などの情報の更新と共有をお願いいたします。すでにFarmilleに掲載されている資材も、これから掲載する資材も対象で、
          <b className={highlightStyle}>申請・掲載・編集は無料です。</b>
        </p>
        <div
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: "3",
            mt: "5",
            pc: { flexDirection: "row", maxW: "content.reading", mx: "auto" },
          })}
        >
          <a className={entryLinkRecipe({ tone: "primary" })} href="#lpFlow">
            初めての方<small>掲載までの流れを見る</small>
          </a>
          <Link className={entryLinkRecipe({ tone: "outline" })} href="/sellers/login">
            企業会員登録済みの方<small>企業会員ダッシュボードにログイン</small>
          </Link>
        </div>
      </section>

      <nav
        className={cx(guideCardStyle, css({ mt: "4.5", py: "3.5", px: "4.5" }))}
        aria-label="利用ガイドの目次"
      >
        <div
          className={css({
            mb: "1.5",
            fontSize: "sm",
            fontWeight: "extrabold",
            letterSpacing: "0.06em",
            color: "text.subtle",
          })}
        >
          目次
        </div>
        {CONTENTS.map(([id, label]) => (
          <a
            className={css({
              display: "block",
              py: "1",
              fontSize: "md",
              fontWeight: "bold",
              color: "primary.800",
              textDecoration: "none",
              _before: { content: '"›"', mr: "2", color: "text.subtle" },
            })}
            key={id}
            href={`#${id}`}
          >
            {label}
          </a>
        ))}
      </nav>

      <section aria-labelledby="lpFlow">
        <div
          className={css({
            display: "inline-flex",
            alignItems: "center",
            gap: "1.5",
            mt: "9",
            fontSize: "xs",
            fontWeight: "extrabold",
            letterSpacing: "0.06em",
            color: "primary.800",
          })}
        >
          初めてFarmilleに資材を掲載いただくメーカー様向け
        </div>
        <h2 id="lpFlow" className={guideEyebrowHeadingStyle}>
          Farmille掲載までの流れ
        </h2>
        <p className={guideSubStyle}>
          <b>
            企業会員登録と企業会員ダッシュボードから、資材掲載に関わる申請を行っていただけます。
          </b>
          <br />
          まずは必要書類をご確認いただき、企業会員登録の申請をお願いいたします。
          <br />
          ※企業会員登録済みの方はSTEP2からお進みください。
        </p>
        <div
          className={cx(
            guideCardStyle,
            css({ mt: "4", pt: "4", px: "3.5", pb: "3.5", overflowX: "auto" }),
          )}
        >
          <div
            className={css({
              display: "flex",
              justifyContent: "center",
              gap: "4.5",
              mb: "3",
              fontSize: "sm",
              fontWeight: "extrabold",
            })}
          >
            <span className={css({ color: "accent.manufacturer" })}>
              <span aria-hidden="true" className={legendSwatchRecipe({ actor: "maker" })} />
              メーカー様作業
            </span>
            <span className={css({ color: "primary.800" })}>
              <span aria-hidden="true" className={legendSwatchRecipe({ actor: "farmille" })} />
              Farmille側作業
            </span>
          </div>
          <ol
            className={css({ display: "flex", gap: "1", minW: "content.form" })}
            aria-label="掲載までの5ステップ"
          >
            {MANUFACTURER_ONBOARDING_STEPS.map((step, index) => (
              <li className={css({ flex: "1", textAlign: "center" })} key={step.title}>
                <span className={chevronRecipe({ actor: step.actor, first: index === 0 })}>
                  {step.actor === "maker" ? `STEP${index + 1}` : <b>STEP{index + 1}</b>}
                </span>
                <div
                  className={css({
                    mt: "2",
                    fontSize: "xs",
                    fontWeight: "bold",
                    lineHeight: "normal",
                  })}
                >
                  {step.title}
                </div>
              </li>
            ))}
          </ol>
          <div
            className={css({
              mt: "3",
              py: "2",
              px: "3",
              bg: "primary.soft",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "primary.700",
              borderRadius: "input",
              fontSize: "sm",
              lineHeight: "prose",
              color: "text.muted",
            })}
          >
            内容について運営より連絡を差し上げる場合があります。ご回答をいただいた後に確認作業を再開しますのでご了承ください。
          </div>
        </div>

        {MANUFACTURER_ONBOARDING_STEPS.map((step, index) => {
          const target = step.action === null ? null : stepLinks[step.action];
          return (
            <article className={stepCardRecipe({ actor: step.actor })} key={step.title}>
              <h3 className={stepLabelRecipe({ actor: step.actor })}>
                STEP{index + 1}　{step.title}
              </h3>
              <div className={stepBodyRecipe({ actor: step.actor })}>{step.body}</div>
              {target === null ? null : (
                <Link className={stepLinkStyle} href={target.href}>
                  {target.label}
                </Link>
              )}
            </article>
          );
        })}
      </section>

      <section aria-labelledby="lpPrep">
        <h2 id="lpPrep" className={guideHeadingStyle}>
          申請にご用意いただくもの
        </h2>
        <p className={guideSubStyle}>
          企業会員登録と資材オーナー権限の申請にあたり、下記のご準備をお願いします。パッケージ・ラベルの画像またはPDFの添付、あるいはパッケージが確認できる製品ページURLのご提示は、STEP2の申請フォームで行います。
        </p>
        <PrepBox title="ご用意いただくもの">
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
              className={guideLinkStyle}
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
        </PrepBox>
        <PrepBox title="資材オーナー権限の申請フォームにご入力いただく項目">
          <li>申請内容（資材情報の新規掲載／掲載済み資材の資材オーナー権限）</li>
          <li>資材名（パッケージ記載の正式名称）</li>
          <li>FarmilleページURL（掲載済み資材の場合）</li>
          <li>当該資材との関係（製造元・販売元・輸入元）</li>
          <li>FarmilleアカウントID（企業会員登録後に運営が発行します）</li>
        </PrepBox>
      </section>

      <section aria-labelledby="lpGuide">
        <h2 id="lpGuide" className={guideHeadingStyle}>
          ご利用ガイド（新規掲載・編集・終売のご依頼）
        </h2>
        <div className={css({ display: "grid", gap: "3.5", mt: "3.5" })}>
          {OWNER_GUIDES.map((item) => (
            <GuideCard id={item.id} key={item.id} title={item.title} needId>
              <ol className={guideListStyle}>
                <li>
                  <span className={listNumberStyle}>１．</span>
                  <Link href={applyHref}>企業会員登録の申請</Link>
                </li>
                <li>
                  <span className={listNumberStyle}>２．</span>
                  <Link href={OWNER_APPLICATION_HREF}>資材オーナー権限の申請フォーム</Link>
                </li>
                <li>
                  <span className={listNumberStyle}>３．</span>
                  <Link href="/dashboard/materials">資材情報の確認・編集</Link>
                  （企業会員ダッシュボードから）
                </li>
              </ol>
              <GuideDetails slug="owner" inline={false} />
            </GuideCard>
          ))}
          <GuideCard id="lpGuideDelist" title="終売の反映・非表示にしたい" needId={false}>
            <p className={css({ mt: "2", textStyle: "prose" })}>
              終売・廃盤表示や資材ページの非表示のご依頼は{" "}
              <a className={guideLinkStyle} href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>{" "}
              で受け付けます。
            </p>
          </GuideCard>
          <section
            className={cx(guideCardStyle, css({ py: "3.5", px: "4.5" }))}
            id="lpGuideMore"
            aria-labelledby="lpGuideMoreTitle"
          >
            <h3 className={guideCardTitleStyle} id="lpGuideMoreTitle">
              企業会員登録済みの方の活用ガイド
            </h3>
            <ol className={guideListStyle}>
              {MEMBER_ACTIONS.map((item, index) => (
                <MemberActionRows key={item.title} item={item} index={index} />
              ))}
            </ol>
          </section>
        </div>
      </section>

      <section aria-labelledby="lpOwner">
        <h2 id="lpOwner" className={guideHeadingStyle}>
          資材オーナー権限とは？
        </h2>
        <div className={cx(guideCardStyle, css({ mt: "3.5", py: "4", px: "5" }))}>
          <p className={css({ textStyle: "prose", color: "text.default" })}>
            Farmilleに掲載される資材ごとに1社に設定する権限で、資材情報の編集権限を含みます。当該資材の製造元・販売元・輸入元の企業様を対象に、パッケージの記載で貴社と資材の関係を確認したうえでお渡しします。権限をお渡しした資材は、企業会員ダッシュボードから製品説明・施用方法・試験結果などの情報を編集できます。
          </p>
        </div>
      </section>

      <section aria-labelledby="lpFaq">
        <h2 id="lpFaq" className={guideHeadingStyle}>
          よくあるご質問
        </h2>
        <div className={cx(guideCardStyle, css({ mt: "3.5", overflow: "hidden" }))}>
          {GUIDE_FAQS.map((faq) => (
            <article
              className={css({
                py: "4",
                px: "4.5",
                borderTopWidth: "1px",
                borderTopStyle: "solid",
                borderTopColor: "border.default",
                _first: { borderTopWidth: "0" },
              })}
              key={faq.question}
            >
              <h3 className={questionStyle}>{faq.question}</h3>
              <div
                className={css({
                  position: "relative",
                  mt: "2",
                  pl: "6",
                  textStyle: "prose",
                  color: "text.muted",
                  _before: {
                    content: '"A"',
                    position: "absolute",
                    left: "0.5",
                    top: "0",
                    color: "text.subtle",
                    fontWeight: "extrabold",
                  },
                })}
              >
                {faq.answer}
                {faq.links.length > 0 ? (
                  <div className={css({ mt: "1.5" })}>
                    {faq.links.map((target) => (
                      <a
                        className={cx(guideLinkStyle, css({ mr: "3.5" }))}
                        href={target.href}
                        key={target.href}
                      >
                        {target.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className={cx(
          guideCardStyle,
          css({ mt: "5.5", py: "4.5", px: "5", pc: { py: "5", px: "6.5" } }),
        )}
        aria-labelledby="lpContact"
      >
        <h2 className={css({ fontSize: "md", fontWeight: "extrabold" })} id="lpContact">
          お問い合わせ
        </h2>
        <a
          className={css({
            display: "inline-block",
            mt: "1",
            fontSize: "lg",
            fontWeight: "extrabold",
            letterSpacing: "0.01em",
            color: "primary.800",
            wordBreak: "break-all",
            textDecoration: "none",
            pc: { fontSize: "xl" },
          })}
          href={`mailto:${CONTACT_EMAIL}`}
        >
          {CONTACT_EMAIL}
        </a>
        <div className={css({ mt: "2", fontSize: "sm", lineHeight: "prose", color: "text.muted" })}>
          企業会員登録、資材オーナー権限、資材ページの掲載内容に関するご質問・ご相談はメールで承ります。
          <br />
          お問い合わせの際は、法人名・ご担当者名・対象資材の名称（掲載済みの場合はFarmilleページのURL）をご記入ください。いただいたご連絡には順次対応いたしますので、お返事までお時間をいただく場合がございます。
        </div>
      </section>

      <section
        className={css({
          mt: "8",
          py: "7",
          px: "5",
          bg: "primary.700",
          color: "text.inverse",
          borderRadius: "card",
          textAlign: "center",
          pc: { py: "9", px: "8" },
        })}
        aria-labelledby="lpApply"
      >
        <h2
          className={css({ fontSize: "xl", fontWeight: "extrabold", pc: { fontSize: "2xl" } })}
          id="lpApply"
        >
          企業会員登録を申請する
        </h2>
        <div className={css({ mt: "2", fontSize: "sm", lineHeight: "prose" })}>
          申請内容を確認し、ご登録のメールアドレスへFarmilleアカウントIDとログインのご案内をお送りします。
          <b>申請・掲載・編集は無料です。</b>
        </div>
        <div
          className={css({
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "2.5",
            mt: "4.5",
            "& a": {
              maxW: "full",
              py: "3",
              px: "4.5",
              bg: "surface.card",
              color: "primary.800",
              borderRadius: "button",
              fontSize: "md",
              fontWeight: "extrabold",
              textDecoration: "none",
              overflowWrap: "anywhere",
            },
          })}
        >
          <Link href={applyHref}>申請フォームへ進む</Link>
          <Link href="/sellers/login">アカウントをお持ちの方はログイン</Link>
        </div>
      </section>
    </div>
  );
}

const guideCardTitleStyle = css({
  pl: "2.5",
  borderLeftWidth: "3px",
  borderLeftStyle: "solid",
  borderLeftColor: "primary.700",
  fontSize: "md",
  fontWeight: "extrabold",
  lineHeight: "snug",
});

function GuideCard({
  id,
  title,
  needId,
  children,
}: {
  id: string;
  title: string;
  needId: boolean;
  children: ReactNode;
}) {
  return (
    <article className={cx(guideCardStyle, css({ py: "3.5", px: "4.5" }))} id={id}>
      <h3 className={guideCardTitleStyle}>
        {title}
        <Badge className={css({ ml: "2.5" })} variant={needId ? "required" : "optional"}>
          {needId ? "ID必須" : "ID不要"}
        </Badge>
      </h3>
      {children}
    </article>
  );
}

function PrepBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={guideBoxStyle}>
      <h3
        className={css({ mb: "2", fontSize: "md", fontWeight: "extrabold", color: "primary.800" })}
      >
        {title}
      </h3>
      <ol
        className={css({
          pl: "4.5",
          textStyle: "prose",
          color: "text.muted",
          "& b": { color: "text.default" },
        })}
      >
        {children}
      </ol>
    </div>
  );
}

function MemberActionRows({
  item,
  index,
}: {
  item: (typeof MEMBER_ACTIONS)[number];
  index: number;
}) {
  return (
    <>
      <li>
        <span className={listNumberStyle}>{String.fromCharCode(0xff11 + index)}．</span>
        <Link href={item.href}>{item.title}</Link>
        {item.note}
        {item.procedure === undefined ? null : <GuideDetails slug={item.procedure} inline />}
      </li>
      {index === 1 ? (
        <li className={css({ pl: "7", color: "text.muted" })}>
          ┗ <Link href={OWNER_APPLICATION_HREF}>仮掲載ページの情報を確認・編集する</Link>
          （資材オーナー権限の申請）
        </li>
      ) : null}
    </>
  );
}

const guideDetailsRecipe = cva({
  variants: {
    inline: {
      false: {
        mt: "3",
        pt: "1",
        borderTopWidth: "1px",
        borderTopStyle: "solid",
        borderTopColor: "border.default",
      },
      true: { mt: "0.5", mb: "1.5", ml: "7" },
    },
  },
});

function GuideDetails({ slug, inline }: { slug: ProcedureSlug; inline: boolean }) {
  return (
    <Collapsible className={guideDetailsRecipe({ inline })}>
      <CollapsibleTrigger variant={inline ? "link" : "section"}>
        対象となる企業様・ご準備いただくもの
      </CollapsibleTrigger>
      <CollapsiblePanel hiddenUntilFound>
        <ProcedureRequirements slug={slug} spacing={inline ? "tight" : "standard"} />
      </CollapsiblePanel>
    </Collapsible>
  );
}

const requirementsRecipe = cva({
  base: {
    display: "grid",
    gap: "3",
    pb: "1",
    pc: { gridTemplateColumns: "1fr 1fr" },
  },
  variants: {
    spacing: { tight: { mt: "2" }, standard: { mt: "3" }, open: { mt: "3.5" } },
  },
  defaultVariants: { spacing: "standard" },
});

const requirementBoxStyle = css({
  py: "3",
  px: "3.5",
  bg: "surface.page",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "input",
  "& h4": { mb: "1.5", fontSize: "sm", fontWeight: "extrabold", color: "primary.800" },
  "& ul": {
    pl: "4",
    fontSize: "sm",
    lineHeight: "prose",
    color: "text.muted",
  },
  "& li + li": { mt: "1" },
  "& li b": { color: "text.default", fontWeight: "bold" },
});

export function ProcedureRequirements({
  slug,
  spacing,
}: {
  slug: ProcedureSlug;
  spacing?: "tight" | "standard" | "open";
}) {
  const procedure = PROCEDURES[slug];
  return (
    <div className={requirementsRecipe({ spacing })}>
      <div className={requirementBoxStyle}>
        <h4>対象となる企業様</h4>
        <ul>
          {procedure.conds.map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ul>
      </div>
      <div className={requirementBoxStyle}>
        <h4>ご準備いただくもの</h4>
        <ul>
          {procedure.prep.map(([item, why]) => (
            <li key={item}>
              <b>{item}</b>
              {why ? (
                <span className={css({ display: "block", fontSize: "xs", color: "text.subtle" })}>
                  {why}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
