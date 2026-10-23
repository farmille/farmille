import { Icon } from "@/components/Icon";
import Link from "next/link";
import type { ReactNode } from "react";

import { css, cva } from "../../../../../styled-system/css";

const noticeRecipe = cva({
  base: {
    display: "flex",
    alignItems: "flex-start",
    gap: "2",
    p: "3",
    textStyle: "note",
    color: "text.muted",
    bg: "surface.page",
    borderWidth: "1px",
    borderColor: "border.default",
    borderRadius: "input",
  },
  variants: {
    spacing: {
      near: { mt: "3" },
      section: { mt: "5.5" },
    },
  },
});
const checkStyle = css({ display: "flex", flex: "none", color: "text.brand" });
const followUpStyle = css({ mt: "1.5" });
const disclaimerStyle = css({
  mt: "2",
  textStyle: "supporting",
  color: "text.subtle",
});
const noticeHeadingStyle = css({ fontWeight: "bold", color: "text.muted" });
const listStyle = css({ listStyle: "none" });
// 製品情報の直後に寄せる（main の gap 8 から詰めて、間を 3 にする）
const pointerStyle = css({ mt: "-5", textStyle: "supporting", color: "text.subtle" });
const noticeLinkStyle = css({
  color: "[inherit]",
  textDecoration: "underline",
  whiteSpace: "nowrap",
});
const textLinkStyle = css({
  color: "text.brand",
  fontWeight: "semibold",
  textDecoration: "none",
});

function CheckedNotice({
  spacing,
  children,
}: {
  spacing: "near" | "section";
  children: ReactNode;
}) {
  return (
    <div className={noticeRecipe({ spacing })}>
      <span className={checkStyle}>
        <Icon name="check" size="sm" />
      </span>
      <div>{children}</div>
    </div>
  );
}

const CONTACT_EMAIL = "contact@farmille.com";

function ContactEmail() {
  return (
    <a className={textLinkStyle} href={`mailto:${CONTACT_EMAIL}`}>
      {CONTACT_EMAIL}
    </a>
  );
}

export function MaterialNoticePointer() {
  return (
    <p className={pointerStyle}>
      ※掲載情報に関する注意事項は、ページ下部の「掲載情報についてのご案内」に記載しています。
    </p>
  );
}

export function MaterialSpecDisclaimer() {
  return (
    <section aria-labelledby="material-notice-heading" className={disclaimerStyle}>
      <h2 id="material-notice-heading" className={noticeHeadingStyle}>
        掲載情報についてのご案内
      </h2>
      <div className={followUpStyle}>掲載している製品情報</div>
      <ul className={listStyle}>
        <li>・農薬・肥料・土壌改良資材等に関する登録・届出・表示情報</li>
        <li>
          ・期待効果・資材ジャンル（Farmilleが独自に、バイオスティミュラント資材として整理・解釈）
        </li>
        <li>
          ・製品説明・主な成分・対象作物・施用方法・技術・作用機作・関係会社・その他の製品情報
        </li>
      </ul>
      <div>
        は、各事業者から提供を受けた情報、または特定時点のウェブサイト等での公開情報をもとに、Farmilleが調査・分類しております。そのため、誤記や最新でない内容を含む場合があります。大変申し訳ありません。
      </div>
      <div className={followUpStyle}>
        お気づきの点がありましたら、
        <ContactEmail />
        までご連絡ください。内容を確認させていただきます。
      </div>
      <div className={followUpStyle}>
        ※メーカーご担当者様へ：掲載内容のお問い合わせ、終売表示、資材ページの非公開のご依頼は、
        <ContactEmail />
        で承ります。終売表示では資材ページを残し、非公開では一般の利用者が閲覧できなくなります。確認のうえ、迅速な対応に努めます。
      </div>
      <div className={followUpStyle}>
        実際の効果は、作物・気象・土壌などの条件によって異なる場合があります。資材の使用にあたっては、当該製品についてメーカー公式サイトなどの公式情報を必ずご確認のうえ、製品の表示・使用条件・使用上の注意など（農薬・肥料・土壌改良資材等として法令上の規制がある資材は、その法令に基づく表示・使用条件を含みます）に従ってご使用ください。
      </div>
    </section>
  );
}

export function PostsCompliance() {
  return (
    <CheckedNotice spacing="section">
      実証詳細レポート・感想口コミは、投稿した生産者の圃場・条件での体験と見解です。条件によって効果や薬害等の出方は異なるため、ご自身の栽培条件と照らし合わせてご覧ください。{" "}
      <Link className={noticeLinkStyle} href="/legal/terms">
        利用規約 →
      </Link>
    </CheckedNotice>
  );
}

export function ArchivedNotice() {
  return (
    <div className={noticeRecipe({ spacing: "near" })}>
      この資材は掲載を終了しています。過去の情報と投稿は参照できますが、新しい感想口コミや実証詳細レポートは投稿できません。
    </div>
  );
}
