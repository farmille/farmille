import Image from "next/image";
import Link from "next/link";
import { buttonRecipe } from "@/components";
import heroPhoto from "@/app/_components/home-hero-rice-field.webp";
import { MANUFACTURER_ONBOARDING_STEPS } from "@/lib/manufacturer-policy";
import { APPLICATION_GUIDANCE, GUIDE_FAQS, MEMBER_ACTIONS } from "./manufacturer-guide";
import { css, cva, cx } from "../../../../styled-system/css";

const section = css({ mt: "10", scrollMarginTop: "24", tab: { mt: "12" } });
const heading = css({
  fontSize: "2xl",
  fontWeight: "800",
  lineHeight: "1.5",
  bg: "primary.100",
  borderLeftWidth: "4px",
  borderLeftStyle: "solid",
  borderColor: "primary.600",
  px: "4",
  py: "3",
  mb: "4",
});
const copy = css({ fontSize: "md", color: "text.muted", lineHeight: "relaxed" });
const link = css({
  color: "primary.700",
  fontWeight: "700",
  textDecoration: "underline",
  textUnderlineOffset: "0.2em",
  overflowWrap: "anywhere",
});
const list = css({
  listStyleType: "disc",
  "&:is(ol)": { listStyleType: "decimal" },
  pl: "5",
  display: "grid",
  gap: "3",
  my: "4",
  fontSize: "md",
  lineHeight: "relaxed",
});
const card = css({
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "button",
  p: "4",
  tab: { p: "6" },
});
const title = css({ fontSize: "lg", fontWeight: "700", lineHeight: "relaxed" });
const grid = css({
  display: "grid",
  gap: "5",
  tab: { gridTemplateColumns: "repeat(2,minmax(0,1fr))" },
});
const block = css({
  py: "6",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderColor: "border.default",
  scrollMarginTop: "24",
});
const buttons = css({
  display: "grid",
  gap: "3",
  my: "6",
  tab: { gridTemplateColumns: "repeat(2,minmax(0,1fr))" },
});
const button = css({
  whiteSpace: "normal",
  textAlign: "center",
  h: "auto",
  py: "4",
  flexDirection: "column",
  gap: "1",
});
const badge = cva({
  base: {
    display: "inline-block",
    fontSize: "xs",
    fontWeight: "700",
    px: "2",
    py: "1",
    ml: "3",
    borderRadius: "pill",
    whiteSpace: "nowrap",
  },
  variants: {
    required: {
      true: { bg: "amber.soft", color: "amber" },
      false: {
        bg: "surface.panel",
        color: "text.subtle",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border.default",
      },
    },
  },
});
const stepCard = cva({
  base: {
    p: "4",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "tag.effect",
    borderRadius: "button",
  },
  variants: {
    operator: {
      true: { borderStyle: "dashed", borderColor: "border.default", bg: "surface.panel" },
    },
  },
});
const arrow = cva({
  base: {
    position: "relative",
    minW: "0",
    p: "2",
    pl: "3",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "1",
    textAlign: "center",
    bg: "tag.effect",
    color: "surface.card",
    fontWeight: "700",
    fontSize: "xs",
    lineHeight: "1.6",
    clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%, 8px 50%)",
    tab: { fontSize: "md", py: "5", px: "4" },
  },
  variants: {
    operator: {
      true: {
        bg: "primary.700",
        color: "primary.700",
        _before: {
          content: '""',
          position: "absolute",
          inset: "1px",
          bg: "surface.card",
          clipPath:
            "polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%, 8px 50%)",
          zIndex: "0",
        },
      },
    },
  },
});

type Guidance = (typeof APPLICATION_GUIDANCE)[keyof typeof APPLICATION_GUIDANCE];
function ApplicationDetails({ guidance }: { guidance: Guidance }) {
  return (
    <details
      className={css({
        mt: "4",
        bg: "surface.panel",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border.default",
        borderRadius: "button",
        p: "3",
      })}
    >
      <summary
        className={css({
          cursor: "pointer",
          fontSize: "sm",
          fontWeight: "700",
          py: "2",
          _focusVisible: { outline: "2px solid", outlineColor: "primary.600" },
        })}
      >
        対象となる企業様・ご準備いただくもの
      </summary>
      <div className={cx(grid, css({ pt: "4" }))}>
        <div>
          <h4 className={title}>対象となる企業様</h4>
          <ul className={list}>
            {guidance.eligibility.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className={title}>ご準備いただくもの</h4>
          <ul className={list}>
            {guidance.documents.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}
const contents = [
  ["flow", "Farmille掲載までの流れ（初回5STEP）"],
  ["documents", "申請にご用意いただくもの"],
  ["guide", "ご利用ガイド（新規掲載・編集・終売申請）"],
  ["faq", "よくあるご質問"],
  ["ownership", "資材オーナー権限とは？"],
] as const;
export type ManufacturerLandingProps = { applyHref: "/sellers/apply" | "/sellers/apply?from=me" };
export function ManufacturerLanding({ applyHref }: ManufacturerLandingProps) {
  const stepLinks = [
    { href: applyHref, label: "企業会員登録の申請はこちらから" },
    { href: "/dashboard/applications/new/registration", label: "申請フォームはこちらから" },
    null,
    null,
    { href: "/dashboard", label: "企業会員ダッシュボードはこちらから" },
  ];
  return (
    <>
      <section
        aria-labelledby="manufacturer-landing-title"
        className={css({
          position: "relative",
          overflow: "hidden",
          py: "16",
          px: "4",
          textAlign: "center",
          tab: { py: "24" },
        })}
      >
        <Image
          src={heroPhoto}
          alt=""
          fill
          priority
          sizes="(min-width: 1200px) 1200px, 100vw"
          className={css({ objectFit: "cover" })}
        />
        <div className={css({ position: "absolute", inset: "0", bg: "card/65" })} />
        <div className={css({ position: "relative" })}>
          <p
            className={css({ fontSize: "xs", fontWeight: "700", letterSpacing: "0.3em", mb: "4" })}
          >
            FOR BUSINESS
          </p>
          <h1
            id="manufacturer-landing-title"
            className={css({
              fontSize: "3xl",
              fontWeight: "800",
              lineHeight: "1.5",
              tab: { fontSize: "display" },
            })}
          >
            Farmille 企業様向け利用ガイド
          </h1>
        </div>
      </section>
      <section className={section} aria-labelledby="membership-title">
        <h2 id="membership-title" className={heading}>
          企業会員登録とは
        </h2>
        <p className={copy}>
          Farmilleでは、生産者により適切な資材情報を届けるために、各資材の製造元・販売元・輸入元にあたるメーカー様に、企業会員のご登録をお願いしています。ご登録いただいた企業様に、資材ごとに
          <strong>
            「資材オーナー権限」（資材ごとに1社に設定する権限で、資材情報の編集権限を含みます）
          </strong>
          をお渡しし、製品説明・施用方法・資料などの情報の更新と共有をお願いいたします。すでにFarmilleに掲載されている資材も、これから掲載する資材も対象で、申請・掲載・編集は無料です。
        </p>
        <div className={buttons}>
          <a className={cx(buttonRecipe({ variant: "primary" }), button)} href="#flow">
            初めての方<span>掲載までの流れを見る</span>
          </a>
          <Link className={cx(buttonRecipe({ variant: "ghost" }), button)} href="/sellers/login">
            企業会員登録済みの方<span>企業会員ダッシュボードにログイン</span>
          </Link>
        </div>
      </section>
      <nav aria-label="利用ガイドの目次" className={card}>
        <h2 className={title}>目次</h2>
        <ul className={cx(list, grid)}>
          {contents.map(([id, label]) => (
            <li key={id}>
              <a className={link} href={`#${id}`}>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <section id="flow" className={section} aria-labelledby="manufacturer-flow-title">
        <p className={copy}>初めてFarmilleに資材を掲載いただくメーカー様向け</p>
        <h2 id="manufacturer-flow-title" className={heading}>
          Farmille掲載までの流れ
        </h2>
        <p className={copy}>
          企業会員登録と企業会員ダッシュボードから、資材掲載に関わる申請を行っていただけます。
          <br />
          まずは必要書類をご確認いただき、企業会員登録の申請をお願いいたします。
          <br />
          ※企業会員登録済みの方はSTEP2からお進みください。
        </p>
        <p className={css({ display: "flex", gap: "4", fontSize: "xs", my: "4" })}>
          <span className={css({ color: "tag.effect" })}>■ メーカー様作業</span>
          <span className={css({ color: "primary.700" })}>□ Farmille側作業</span>
        </p>
        <ol
          aria-label="掲載までの5ステップ"
          className={css({
            display: "grid",
            gridTemplateColumns: "repeat(5,minmax(0,1fr))",
            gap: "0.5",
          })}
        >
          {MANUFACTURER_ONBOARDING_STEPS.map((step, index) => (
            <li className={arrow({ operator: index === 2 || index === 3 })} key={step.title}>
              <span className={css({ position: "relative" })}>STEP{index + 1}</span>
              <span className={css({ position: "relative" })}>{step.title}</span>
            </li>
          ))}
        </ol>
        <p className={cx(copy, css({ my: "4" }))}>
          内容について運営より連絡を差し上げる場合があります。ご回答をいただいた後に確認作業を再開しますのでご了承ください。
        </p>
        <div className={css({ display: "grid", gap: "3" })}>
          {MANUFACTURER_ONBOARDING_STEPS.map((step, index) => {
            const target = stepLinks[index];
            return (
              <article
                className={stepCard({ operator: index === 2 || index === 3 })}
                key={step.title}
              >
                <h3 className={title}>
                  STEP{index + 1}　{step.title}
                </h3>
                <p className={copy}>{step.body}</p>
                {target && (
                  <p className={css({ mt: "3" })}>
                    <Link className={link} href={target.href}>
                      {target.label} →
                    </Link>
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>
      <section id="documents" className={section} aria-labelledby="documents-title">
        <h2 id="documents-title" className={heading}>
          申請にご用意いただくもの
        </h2>
        <p className={copy}>
          企業会員登録と資材オーナー権限の申請にあたり、下記のご準備をお願いします。パッケージ・ラベルの画像またはPDFの添付、あるいはパッケージが確認できる製品ページURLのご提示は、STEP2の申請フォームで行います。
        </p>
        <div className={cx(grid, css({ mt: "5" }))}>
          <div className={card}>
            <h3 className={title}>ご用意いただくもの</h3>
            <ul className={list}>
              <li>
                資材ごとのパッケージ・ラベルの画像（貴社名の記載箇所を含む。当該資材との関係確認のため）。または、パッケージ画像が掲載されている公式サイト・ECサイトの製品ページURL
              </li>
              <li>会社概要ページのURL（申請元確認のため）</li>
              <li>
                法人番号（13桁）。
                <a
                  className={link}
                  href="https://www.houjin-bangou.nta.go.jp/"
                  target="_blank"
                  rel="noreferrer"
                >
                  国税庁 法人番号公表サイト
                </a>
                で確認できます
              </li>
              <li>ご担当者の氏名・部署・メールアドレス・電話番号（公開されません）</li>
            </ul>
          </div>
          <div className={card}>
            <h3 className={title}>資材オーナー権限の申請フォームにご入力いただく項目</h3>
            <ul className={list}>
              <li>申請内容（資材情報の新規掲載／掲載済み資材の資材オーナー権限）</li>
              <li>資材名（パッケージ記載の正式名称）</li>
              <li>FarmilleページURL（掲載済み資材の場合）</li>
              <li>当該資材との関係（製造元・販売元・輸入元）</li>
              <li>FarmilleアカウントID（企業会員登録後に運営が発行します）</li>
            </ul>
          </div>
        </div>
      </section>
      <section id="guide" className={section} aria-labelledby="guide-title">
        <h2 id="guide-title" className={heading}>
          ご利用ガイド（新規掲載・編集・終売申請）
        </h2>
        {[
          { id: "guide-new", title: "新しく資材を掲載したい" },
          { id: "guide-existing", title: "掲載されている自社資材の情報を確認・編集したい" },
        ].map((item) => (
          <article id={item.id} key={item.id} className={block}>
            <h3 className={title}>
              {item.title}
              <span className={badge({ required: true })}>ID必須</span>
            </h3>
            <ol className={list}>
              <li>
                <Link className={link} href={applyHref}>
                  企業会員登録の申請
                </Link>
              </li>
              <li>
                <Link className={link} href="/dashboard/applications/new/registration">
                  資材オーナー権限の申請フォーム
                </Link>
              </li>
              <li>
                <Link className={link} href="/dashboard/materials">
                  資材情報の確認・編集（企業会員ダッシュボードから）
                </Link>
              </li>
            </ol>
            <ApplicationDetails guidance={APPLICATION_GUIDANCE.registration} />
          </article>
        ))}
        <article id="guide-removal" className={block}>
          <h3 className={title}>
            終売の反映・非表示にしたい<span className={badge({ required: false })}>ID不要</span>
          </h3>
          <ol className={list}>
            <li>
              <Link className={link} href="/company-requests/removal">
                受付フォームにご記入（申請用フォームを送付いたします）
              </Link>
            </li>
            <li>申請フォームにご記入・ご提出（メールに記載のURLから開きます）</li>
          </ol>
          <ApplicationDetails guidance={APPLICATION_GUIDANCE.removal} />
        </article>
        <section id="members" className={block} aria-labelledby="members-title">
          <h3 id="members-title" className={title}>
            企業会員登録済みの方の活用ガイド
          </h3>
          <ol className={list}>
            {MEMBER_ACTIONS.map((item, index) => (
              <li key={item.title}>
                <Link className={link} href={item.href}>
                  {item.title}
                </Link>
                {index === 1 && (
                  <p className={css({ mt: "3" })}>
                    ┗{" "}
                    <Link className={link} href="/dashboard/applications/new/registration">
                      仮掲載ページの情報を確認・編集する（資材オーナー権限の申請）
                    </Link>
                  </p>
                )}
                {item.guidance && <ApplicationDetails guidance={item.guidance} />}
              </li>
            ))}
          </ol>
        </section>
      </section>
      <section id="ownership" className={section}>
        <h2 className={heading}>資材オーナー権限とは？</h2>
        <p className={copy}>
          Farmilleに掲載される資材ごとに1社に設定する権限で、資材情報の編集権限を含みます。当該資材の製造元・販売元・輸入元の企業様を対象に、パッケージの記載で貴社と資材の関係を確認したうえでお渡しします。権限をお渡しした資材は、企業会員ダッシュボードから製品説明・施用方法・試験結果などの情報を編集できます。
        </p>
      </section>
      <section id="faq" className={section} aria-labelledby="faq-title">
        <h2 id="faq-title" className={heading}>
          よくあるご質問
        </h2>
        {GUIDE_FAQS.map((faq) => (
          <article className={block} key={faq.question}>
            <h3 className={cx(title, css({ color: "primary.700" }))}>Q　{faq.question}</h3>
            <p className={cx(copy, css({ mt: "3" }))}>A　{faq.answer}</p>
            {faq.links.map((target) => (
              <p key={target.href} className={css({ mt: "3" })}>
                <a className={link} href={target.href}>
                  {target.label} →
                </a>
              </p>
            ))}
          </article>
        ))}
      </section>
      <section className={cx(section, card)}>
        <h2 className={title}>お問い合わせ</h2>
        <p className={css({ my: "3" })}>
          <a className={link} href="mailto:contact@farmille.com">
            contact@farmille.com
          </a>
        </p>
        <p className={copy}>
          企業会員登録、資材オーナー権限、資材ページの掲載内容に関するご質問・ご相談はメールで承ります。
          <br />
          お問い合わせの際は、法人名・ご担当者名・対象資材の名称（掲載済みの場合はFarmilleページのURL）をご記入ください。いただいたご連絡には順次対応いたしますので、お返事までお時間をいただく場合がございます。
        </p>
      </section>
      <section className={cx(section, card, css({ textAlign: "center", bg: "primary.100" }))}>
        <h2 className={title}>企業会員登録を申請する</h2>
        <p className={copy}>
          申請内容を確認し、ご登録のメールアドレスへFarmilleアカウントIDとログインのご案内をお送りします。申請・掲載・編集は無料です。
        </p>
        <div className={buttons}>
          <Link className={cx(buttonRecipe({ variant: "primary" }), button)} href={applyHref}>
            申請フォームへ進む
          </Link>
          <Link className={cx(buttonRecipe({ variant: "ghost" }), button)} href="/sellers/login">
            アカウントをお持ちの方はログイン
          </Link>
        </div>
      </section>
    </>
  );
}
