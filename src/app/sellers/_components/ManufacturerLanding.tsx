import Image from "next/image";
import Link from "next/link";

import heroPhoto from "@/app/_components/home-hero-rice-field.webp";
import {
  MANUFACTURER_ONBOARDING_STEPS,
  type ManufacturerOnboardingAction,
} from "@/lib/manufacturer-policy";

import {
  CONTACT_EMAIL,
  GUIDE_FAQS,
  MEMBER_ACTIONS,
  OWNER_APPLICATION_HREF,
  PROCEDURES,
  REMOVAL_INTAKE_HREF,
  type ProcedureSlug,
} from "./manufacturer-guide";

const CONTENTS = [
  ["lpFlow", "Farmille掲載までの流れ（初回5STEP）"],
  ["lpPrep", "申請にご用意いただくもの"],
  ["lpGuide", "ご利用ガイド（新規掲載・編集・終売申請）"],
  ["lpFaq", "よくあるご質問"],
  ["lpOwner", "資材オーナー権限とは？"],
] as const;

const OWNER_GUIDES = [
  { id: "lpGuideNew", title: "新しく資材を掲載したい" },
  { id: "lpGuideExisting", title: "掲載されている自社資材の情報を確認・編集したい" },
] as const;

export type ManufacturerLandingProps = { applyHref: "/sellers/apply" | "/sellers/apply?from=me" };

/**
 * 見本 S.sellersLP（メーカーの方へ）の `.body.slp` の中身。スタイルは src/app/_mock/mock.css・sellers.css（.fm 配下）。
 * 見本の button[data-go] は実在するルートへの a にしている。
 */
export function ManufacturerLanding({ applyHref }: ManufacturerLandingProps) {
  const stepLinks = {
    register: { href: applyHref, label: "企業会員登録の申請はこちらから →" },
    ownerApplication: { href: OWNER_APPLICATION_HREF, label: "申請フォームはこちらから →" },
    dashboard: { href: "/dashboard", label: "企業会員ダッシュボードはこちらから →" },
  } as const satisfies Record<ManufacturerOnboardingAction, { href: string; label: string }>;

  return (
    <div className="slp">
      <div className="slp-photo">
        <div className="slp-photo-bg" aria-hidden="true">
          <Image alt="" fill priority sizes="100vw" src={heroPhoto} />
        </div>
        <div className="slp-photo-copy">
          <div className="ey">FOR BUSINESS</div>
          <h1>Farmille 企業様向け利用ガイド</h1>
        </div>
      </div>

      <section aria-labelledby="lpAbout">
        <h2 id="lpAbout" className="slp-band">
          企業会員登録とは
        </h2>
        <p className="slp-lead">
          Farmilleでは、生産者により適切な資材情報を届けるために、各資材の製造元・販売元・輸入元にあたるメーカー様に、企業会員のご登録をお願いしています。ご登録いただいた企業様に、資材ごとに
          <b className="hl">
            「資材オーナー権限」（資材ごとに1社に設定する権限で、資材情報の編集権限を含みます）
          </b>
          をお渡しし、製品説明・施用方法・資料などの情報の更新と共有をお願いいたします。すでにFarmilleに掲載されている資材も、これから掲載する資材も対象で、
          <b className="hl">申請・掲載・編集は無料です。</b>
        </p>
        <div className="slp-2btn">
          <a href="#lpFlow">
            初めての方<small>掲載までの流れを見る</small>
          </a>
          <Link className="alt" href="/sellers/login">
            企業会員登録済みの方<small>企業会員ダッシュボードにログイン</small>
          </Link>
        </div>
      </section>

      <nav className="slp-toc" aria-label="利用ガイドの目次">
        <div className="h">目次</div>
        {CONTENTS.map(([id, label]) => (
          <a key={id} href={`#${id}`}>
            {label}
          </a>
        ))}
      </nav>

      <section aria-labelledby="lpFlow">
        <div className="slp-eyebrow" style={{ marginTop: 36 }}>
          初めてFarmilleに資材を掲載いただくメーカー様向け
        </div>
        <h2 id="lpFlow" className="slp-h2" style={{ marginTop: 6 }}>
          Farmille掲載までの流れ
        </h2>
        <p className="slp-sub">
          <b>
            企業会員登録と企業会員ダッシュボードから、資材掲載に関わる申請を行っていただけます。
          </b>
          <br />
          まずは必要書類をご確認いただき、企業会員登録の申請をお願いいたします。
          <br />
          ※企業会員登録済みの方はSTEP2からお進みください。
        </p>
        <div className="slp-tl">
          <div className="slp-tl-legend">
            <span className="lg mk">メーカー様作業</span>
            <span className="lg fm">Farmille側作業</span>
          </div>
          <ol className="slp-tl-steps one" aria-label="掲載までの5ステップ">
            {MANUFACTURER_ONBOARDING_STEPS.map((step, index) => (
              <li
                className={step.actor === "maker" ? "slp-tl-step mk" : "slp-tl-step fm"}
                key={step.title}
              >
                <span className="chev">
                  {step.actor === "maker" ? `STEP${index + 1}` : <b>STEP{index + 1}</b>}
                </span>
                <div className="lb">{step.title}</div>
              </li>
            ))}
          </ol>
          <div className="slp-tl-note">
            内容について運営より連絡を差し上げる場合があります。ご回答をいただいた後に確認作業を再開しますのでご了承ください。
          </div>
        </div>

        {MANUFACTURER_ONBOARDING_STEPS.map((step, index) => {
          const target = step.action === null ? null : stepLinks[step.action];
          const isFarmille = step.actor === "farmille";
          return (
            <article className={isFarmille ? "slp-stepcard fm" : "slp-stepcard"} key={step.title}>
              <h3 className={isFarmille ? "st fm" : "st"}>
                STEP{index + 1}　{step.title}
              </h3>
              <div className="d">{step.body}</div>
              {target === null ? null : (
                <Link className="lk" href={target.href}>
                  {target.label}
                </Link>
              )}
            </article>
          );
        })}
      </section>

      <section aria-labelledby="lpPrep">
        <h2 id="lpPrep" className="slp-h2">
          申請にご用意いただくもの
        </h2>
        <p className="slp-sub">
          企業会員登録と資材オーナー権限の申請にあたり、下記のご準備をお願いします。パッケージ・ラベルの画像またはPDFの添付、あるいはパッケージが確認できる製品ページURLのご提示は、STEP2の申請フォームで行います。
        </p>
        <div className="slp-prep2">
          <h3 className="h">ご用意いただくもの</h3>
          <ol>
            <li>
              <b>資材ごとのパッケージ・ラベルの画像</b>
              （貴社名の記載箇所を含む。当該資材との関係確認のため）。または、パッケージ画像が掲載されている公式サイト・ECサイトの製品ページURL
            </li>
            <li>
              <b>会社概要ページのURL</b>（申請元確認のため）
            </li>
            <li>
              <b>法人番号（13桁）</b>。
              <a href="https://www.houjin-bangou.nta.go.jp/" target="_blank" rel="noreferrer">
                国税庁 法人番号公表サイト
              </a>
              で確認できます
            </li>
            <li>
              <b>ご担当者の氏名・部署・メールアドレス・電話番号</b>（公開されません）
            </li>
          </ol>
        </div>
        <div className="slp-prep2">
          <h3 className="h">資材オーナー権限の申請フォームにご入力いただく項目</h3>
          <ol>
            <li>申請内容（資材情報の新規掲載／掲載済み資材の資材オーナー権限）</li>
            <li>資材名（パッケージ記載の正式名称）</li>
            <li>FarmilleページURL（掲載済み資材の場合）</li>
            <li>当該資材との関係（製造元・販売元・輸入元）</li>
            <li>FarmilleアカウントID（企業会員登録後に運営が発行します）</li>
          </ol>
        </div>
      </section>

      <section aria-labelledby="lpGuide">
        <h2 id="lpGuide" className="slp-h2">
          ご利用ガイド（新規掲載・編集・終売申請）
        </h2>
        <div className="slp-guide">
          {OWNER_GUIDES.map((item) => (
            <article className="g" id={item.id} key={item.id}>
              <h3 className="h">
                {item.title}
                <span className="need">ID必須</span>
              </h3>
              <ol>
                <li>
                  <span className="n">１．</span>
                  <Link href={applyHref}>企業会員登録の申請</Link>
                </li>
                <li>
                  <span className="n">２．</span>
                  <Link href={OWNER_APPLICATION_HREF}>資材オーナー権限の申請フォーム</Link>
                </li>
                <li>
                  <span className="n">３．</span>
                  <Link href="/dashboard/materials">資材情報の確認・編集</Link>
                  （企業会員ダッシュボードから）
                </li>
              </ol>
              <GuideDetails slug="owner" inline={false} />
            </article>
          ))}
          <article className="g" id="lpGuideDelist">
            <h3 className="h">
              終売の反映・非表示にしたい
              <span className="need no">ID不要</span>
            </h3>
            <ol>
              <li>
                <span className="n">１．</span>
                <Link href={REMOVAL_INTAKE_HREF}>受付フォームにご記入</Link>
                （申請用フォームを送付いたします）
              </li>
              <li>
                <span className="n">２．</span>
                申請フォームにご記入・ご提出（メールに記載のURLから開きます）
              </li>
            </ol>
            <GuideDetails slug="removal" inline={false} />
          </article>
          <section className="g" id="lpGuideMore" aria-labelledby="lpGuideMoreTitle">
            <h3 className="h" id="lpGuideMoreTitle">
              企業会員登録済みの方の活用ガイド
            </h3>
            <ol>
              {MEMBER_ACTIONS.map((item, index) => (
                <MemberActionRows key={item.title} item={item} index={index} />
              ))}
            </ol>
          </section>
        </div>
      </section>

      <section aria-labelledby="lpOwner">
        <h2 id="lpOwner" className="slp-h2">
          資材オーナー権限とは？
        </h2>
        <div className="slp-ownerbox">
          <p>
            Farmilleに掲載される資材ごとに1社に設定する権限で、資材情報の編集権限を含みます。当該資材の製造元・販売元・輸入元の企業様を対象に、パッケージの記載で貴社と資材の関係を確認したうえでお渡しします。権限をお渡しした資材は、企業会員ダッシュボードから製品説明・施用方法・試験結果などの情報を編集できます。
          </p>
        </div>
      </section>

      <section aria-labelledby="lpFaq">
        <h2 id="lpFaq" className="slp-h2">
          よくあるご質問
        </h2>
        <div className="faq-acc">
          {GUIDE_FAQS.map((faq) => (
            <article className="fq" key={faq.question}>
              <h3 className="q">{faq.question}</h3>
              <div className="a">
                {faq.answer}
                {faq.links.length > 0 ? (
                  <div style={{ marginTop: 6 }}>
                    {faq.links.map((target) => (
                      <a className="lk" href={target.href} key={target.href}>
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

      <section className="slp-contact" aria-labelledby="lpContact">
        <h2 className="t" id="lpContact">
          お問い合わせ
        </h2>
        <a className="mail" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
        <div className="d">
          企業会員登録、資材オーナー権限、資材ページの掲載内容に関するご質問・ご相談はメールで承ります。
          <br />
          お問い合わせの際は、法人名・ご担当者名・対象資材の名称（掲載済みの場合はFarmilleページのURL）をご記入ください。いただいたご連絡には順次対応いたしますので、お返事までお時間をいただく場合がございます。
        </div>
      </section>

      <section className="slp-cta" aria-labelledby="lpApply">
        <h2 className="t" id="lpApply">
          企業会員登録を申請する
        </h2>
        <div className="d">
          申請内容を確認し、ご登録のメールアドレスへFarmilleアカウントIDとログインのご案内をお送りします。
          <b>申請・掲載・編集は無料です。</b>
        </div>
        <div className="b">
          <Link href={applyHref}>申請フォームへ進む</Link>
          <Link href="/sellers/login">アカウントをお持ちの方はログイン</Link>
        </div>
      </section>
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
        <span className="n">{String.fromCharCode(0xff11 + index)}．</span>
        <Link href={item.href}>{item.title}</Link>
        {item.note}
        {item.procedure === undefined ? null : <GuideDetails slug={item.procedure} inline />}
      </li>
      {index === 1 ? (
        <li className="sub">
          ┗ <Link href={OWNER_APPLICATION_HREF}>仮掲載ページの情報を確認・編集する</Link>
          （資材オーナー権限の申請）
        </li>
      ) : null}
    </>
  );
}

/** 見本の GD()：「対象となる企業様・ご準備いただくもの」を開閉で見せる。 */
function GuideDetails({ slug, inline }: { slug: ProcedureSlug; inline: boolean }) {
  return (
    <details className={inline ? "gd inline" : "gd"}>
      <summary>
        対象となる企業様・ご準備いただくもの<span className="pm"></span>
      </summary>
      <ProcedureRequirements slug={slug} />
    </details>
  );
}

/** 見本 GD() の中身（.gd-b）。お手続きの詳細ページでも使う。 */
export function ProcedureRequirements({
  slug,
  open = false,
}: {
  slug: ProcedureSlug;
  open?: boolean;
}) {
  const procedure = PROCEDURES[slug];
  return (
    <div className={open ? "gd-b open" : "gd-b"}>
      <div className="gd-c">
        <h4 className="gh">対象となる企業様</h4>
        <ul>
          {procedure.conds.map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ul>
      </div>
      <div className="gd-c">
        <h4 className="gh">ご準備いただくもの</h4>
        <ul>
          {procedure.prep.map(([item, why]) => (
            <li key={item}>
              <b>{item}</b>
              {why ? <span className="w">{why}</span> : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
