import "../../_mock/sellers.css";

import type { Metadata } from "next";
import Link from "next/link";

import { MockPageShell } from "@/app/_mock/MockPageShell";
import { createPageMetadata } from "@/lib/seo";

import {
  CONTACT_EMAIL,
  PROCEDURE_FAQS,
  PROCEDURE_ORDER,
  PROCEDURES,
} from "../_components/manufacturer-guide";

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: "よくあるご質問・お手続き一覧",
    description:
      "企業会員登録・資材オーナー権限・資材ページのお手続きについてのよくあるご質問と、お手続きの一覧です。",
    path: "/sellers/procedures",
  });
}

/** 見本 S.sellerProcs（よくあるご質問＋お手続き一覧）。 */
export default function SellerProceduresPage() {
  return (
    <MockPageShell title="よくあるご質問" backHref="/sellers">
      <div className="slp" style={{ maxWidth: 820, marginLeft: "auto", marginRight: "auto" }}>
        <h1 style={{ fontSize: 20, lineHeight: 1.45 }}>よくあるご質問</h1>
        <p className="slp-sub" style={{ marginTop: 8 }}>
          企業会員登録・資材オーナー権限・資材ページのお手続きについて。
        </p>
        <div className="stack" style={{ marginTop: 16 }}>
          {PROCEDURE_FAQS.map((faq) => (
            <article className="card qa" key={faq.question}>
              <h2 className="q">{faq.question}</h2>
              <div className="a">
                {faq.answer}
                {faq.links.length > 0 ? (
                  <div style={{ marginTop: 6 }}>
                    {faq.links.map((target) => (
                      <Link
                        className="lk"
                        href={target.href}
                        key={target.href}
                        style={{ marginRight: 14 }}
                      >
                        {target.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        <h2 className="slp-h2">お手続き一覧</h2>
        <div className="slp-other" style={{ marginTop: 12 }}>
          {PROCEDURE_ORDER.map((slug) => {
            const procedure = PROCEDURES[slug];
            return (
              <Link className="slp-other-i" href={`/sellers/procedures/${slug}`} key={slug}>
                <div>
                  <div className="t">{procedure.listTitle}</div>
                  <span className={procedure.needId ? "slp-tag" : "slp-tag no"}>
                    {procedure.needId ? "会員登録が必要です" : "会員登録は不要です"}
                  </span>
                </div>
                <span className="ar" aria-hidden="true">
                  ›
                </span>
              </Link>
            );
          })}
        </div>

        <div className="slp-help" style={{ marginTop: 22 }}>
          <div className="slp-help-i">
            <span className="faq mail" aria-hidden="true">
              ✉
            </span>
            <div>
              <div className="t">お問い合わせ</div>
              <div className="d">
                お問い合わせはこちらまで　
                <a href={`mailto:${CONTACT_EMAIL}`}>
                  <b>{CONTACT_EMAIL}</b>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MockPageShell>
  );
}
