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
    fontSize: "sm",
    lineHeight: "normal",
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
const checkStyle = css({ display: "flex", flex: "none", color: "primary.700" });
const followUpStyle = css({ mt: "1.5" });
const disclaimerStyle = css({
  mt: "2",
  fontSize: "xs",
  lineHeight: "prose",
  color: "text.subtle",
});
const noticeLinkStyle = css({
  color: "inherit",
  textDecoration: "underline",
  whiteSpace: "nowrap",
});
const textLinkStyle = css({
  color: "primary.800",
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

export function MaterialPageCompliance({ makerVerified }: { makerVerified: boolean }) {
  return (
    <CheckedNotice spacing="near">
      {makerVerified
        ? "製品情報は企業会員（資材オーナー企業）が記入・管理しています。掲載情報は効果を保証するものではありません。"
        : "このページはFarmille運営が、メーカーの公開資料（製品ページ・パンフレット・SDS等）をもとに作成したもので、メーカーによる内容の確認は受けていません。誤記や最新でない内容を含むことがあり、効果を保証するものではありません。"}
      使用前に必ずメーカー公式情報をご確認ください。{" "}
      <Link className={noticeLinkStyle} href="/legal/disclaimer">
        免責事項 →
      </Link>
      {makerVerified ? null : (
        <div className={followUpStyle}>
          メーカーご担当者様：内容の修正や掲載に関するご要望は{" "}
          <Link className={noticeLinkStyle} href="/sellers/procedures">
            こちら →
          </Link>
        </div>
      )}
    </CheckedNotice>
  );
}

export function MaterialSpecDisclaimer() {
  return (
    <section aria-label="掲載情報と投稿についての注意事項" className={disclaimerStyle}>
      <div>
        「−」の項目は、メーカーによる確認が済んでいない項目、またはメーカーの意向で掲載していない項目です。
        <Link className={textLinkStyle} href="/sellers/procedures">
          メーカーご担当者様はご連絡ください →
        </Link>
      </div>
      <div className={followUpStyle}>
        掲載している商品情報（農薬・肥料・土壌改良資材等に関する登録・届出・表示情報を含みます）は、各事業者によって提供・編集を受けた情報、Farmilleによる調査、または各事業者のウェブサイト等にて公開されている特定時点の情報をもとに作成したものです。当サイトに掲載している情報には、誤記や最新でない内容を含む可能性があり、その正確性・完全性・最新性を保証するものではありません。
      </div>
      <div className={followUpStyle}>
        作物・効果・施用方法の分類は、農林水産省の通知（30消安第6281号）・JBSAの公式分類等を参考に、Farmilleがバイオスティミュラント資材として整理・解釈したものです。これらの分類や記載は、当該資材の効果を検証・保証するものではありません。
      </div>
      <div className={followUpStyle}>
        商品の使用にあたっては、当該製品についてメーカー公式サイトなどの公式情報を必ずご確認のうえ、製品の表示や使用条件に従ってご使用ください。
      </div>
      <div className={followUpStyle}>
        また、農薬、肥料、土壌改良資材等として法令上の登録・届出・表示その他の規制がある資材については、当該法令およびそれに基づく製品表示・使用条件等をご確認のうえ、それらに従ってご使用ください。ご利用の前に
        <Link className={textLinkStyle} href="/legal">
          規約・ガイドライン
        </Link>
        をご確認ください。
      </div>
    </section>
  );
}

export function PostsCompliance() {
  return (
    <CheckedNotice spacing="section">
      実証詳細レポート・感想口コミは、投稿した生産者個人の圃場・条件での体験と見解です。ほかの圃場・作物・気象条件で同じ結果が得られることや、薬害等が生じないことを保証するものではありません。{" "}
      <Link className={noticeLinkStyle} href="/legal/disclaimer">
        免責事項 →
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
