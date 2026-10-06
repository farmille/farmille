import Link from "next/link";

import { MockCheckIcon } from "./MockParts";

/** 見本 S.material の資材カード直下の `.compliance`（掲載情報の出どころ）。 */
export function MaterialPageCompliance({ makerVerified }: { makerVerified: boolean }) {
  return (
    <div className="compliance" style={{ marginTop: 12 }}>
      <span className="ck">
        <MockCheckIcon />
      </span>
      <div>
        {makerVerified
          ? "製品情報は企業会員（資材オーナー企業）が記入・管理しています。掲載情報は効果を保証するものではありません。"
          : "このページはFarmille運営が、メーカーの公開資料（製品ページ・パンフレット・SDS等）をもとに作成したもので、メーカーによる内容の確認は受けていません。誤記や最新でない内容を含むことがあり、効果を保証するものではありません。"}
        使用前に必ずメーカー公式情報をご確認ください。{" "}
        <Link className="link-more" href="/legal/disclaimer">
          免責事項 →
        </Link>
        {makerVerified ? null : (
          <div style={{ marginTop: 6 }}>
            メーカーご担当者様：内容の修正や掲載に関するご要望は{" "}
            <Link className="link-more" href="/sellers/procedures">
              こちら →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/** 見本 S.material の製品詳細の下に置く注記（`.disclaimer`）。 */
export function MaterialSpecDisclaimer() {
  return (
    <section
      aria-label="掲載情報と投稿についての注意事項"
      className="disclaimer"
      style={{ marginTop: 8, lineHeight: 1.9 }}
    >
      <div>
        「−」の項目は、メーカーによる確認が済んでいない項目、またはメーカーの意向で掲載していない項目です。
        <Link className="text-link" href="/sellers/procedures">
          メーカーご担当者様はご連絡ください →
        </Link>
      </div>
      <div style={{ marginTop: 6 }}>
        掲載している商品情報（農薬・肥料・土壌改良資材等に関する登録・届出・表示情報を含みます）は、各事業者によって提供・編集を受けた情報、Farmilleによる調査、または各事業者のウェブサイト等にて公開されている特定時点の情報をもとに作成したものです。当サイトに掲載している情報には、誤記や最新でない内容を含む可能性があり、その正確性・完全性・最新性を保証するものではありません。
      </div>
      <div style={{ marginTop: 6 }}>
        作物・効果・施用方法の分類は、農林水産省の通知（30消安第6281号）・JBSAの公式分類等を参考に、Farmilleがバイオスティミュラント資材として整理・解釈したものです。これらの分類や記載は、当該資材の効果を検証・保証するものではありません。
      </div>
      <div style={{ marginTop: 6 }}>
        商品の使用にあたっては、当該製品についてメーカー公式サイトなどの公式情報を必ずご確認のうえ、製品の表示や使用条件に従ってご使用ください。
      </div>
      <div style={{ marginTop: 6 }}>
        また、農薬、肥料、土壌改良資材等として法令上の登録・届出・表示その他の規制がある資材については、当該法令およびそれに基づく製品表示・使用条件等をご確認のうえ、それらに従ってご使用ください。ご利用の前に
        <Link className="text-link" href="/legal">
          規約・ガイドライン
        </Link>
        をご確認ください。
      </div>
    </section>
  );
}

/** 見本 S.material の投稿一覧の前に置く `.compliance`（投稿は個人の体験）。 */
export function PostsCompliance() {
  return (
    <div className="compliance" style={{ marginTop: 22 }}>
      <span className="ck">
        <MockCheckIcon />
      </span>
      <div>
        実証詳細レポート・感想口コミは、投稿した生産者個人の圃場・条件での体験と見解です。ほかの圃場・作物・気象条件で同じ結果が得られることや、薬害等が生じないことを保証するものではありません。{" "}
        <Link className="link-more" href="/legal/disclaimer">
          免責事項 →
        </Link>
      </div>
    </div>
  );
}

/** 掲載終了の資材に出す注記（文言はアプリの既存表示のまま、見た目だけ見本の `.compliance`）。 */
export function ArchivedNotice() {
  return (
    <p className="compliance" style={{ marginTop: 12 }}>
      この資材は掲載を終了しています。過去の情報と投稿は参照できますが、新しい感想口コミや実証詳細レポートは投稿できません。
    </p>
  );
}
