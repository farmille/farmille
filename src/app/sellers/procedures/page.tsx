import type { Metadata } from "next";
import Link from "next/link";

import { MockPageShell } from "@/app/_mock/MockPageShell";
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import { createPageMetadata } from "@/lib/seo";

import { css, cva, cx } from "../../../../styled-system/css";
import {
  guideCardStyle,
  guideHeadingStyle,
  guideNarrowPageStyle,
  guideLeadStyle,
  guideTitleStyle,
  questionStyle,
} from "../_components/guide-styles";
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

const tileStyle = css({ display: "flex", alignItems: "center", gap: "3", py: "3.5", px: "4" });

const membershipRecipe = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "1.5",
    mt: "2",
    fontSize: "xs",
    whiteSpace: "nowrap",
    _before: { content: '""', w: "2", h: "2", borderRadius: "pill" },
  },
  variants: {
    needId: {
      true: { color: "primary.800", fontWeight: "bold", _before: { bg: "primary.700" } },
      false: { color: "text.subtle", fontWeight: "medium", _before: { bg: "border.strong" } },
    },
  },
});

/** よくあるご質問とお手続きの一覧。 */
export default function SellerProceduresPage() {
  return (
    <MockPageShell title="よくあるご質問" backHref="/sellers">
      <div className={guideNarrowPageStyle}>
        <h1 className={guideTitleStyle}>よくあるご質問</h1>
        <p className={guideLeadStyle}>
          企業会員登録・資材オーナー権限・資材ページのお手続きについて。
        </p>
        <div className={css({ display: "flex", flexDirection: "column", gap: "3", mt: "4" })}>
          {PROCEDURE_FAQS.map((faq) => (
            <article className={surfaceCardRecipe({ padding: "cozy" })} key={faq.question}>
              <h2 className={questionStyle}>{faq.question}</h2>
              <div
                className={css({
                  mt: "1.5",
                  pl: "5",
                  fontSize: "sm",
                  lineHeight: "prose",
                  color: "text.muted",
                })}
              >
                {faq.answer}
                {faq.links.length > 0 ? (
                  <div className={css({ mt: "1.5" })}>
                    {faq.links.map((target) => (
                      <Link
                        className={css({
                          mr: "3.5",
                          color: "primary.700",
                          textDecoration: "underline",
                        })}
                        href={target.href}
                        key={target.href}
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

        <h2 className={guideHeadingStyle}>お手続き一覧</h2>
        <div
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: "2",
            mt: "3",
            pc: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5" },
          })}
        >
          {PROCEDURE_ORDER.map((slug) => {
            const procedure = PROCEDURES[slug];
            return (
              <Link
                className={cx(
                  guideCardStyle,
                  tileStyle,
                  css({
                    justifyContent: "space-between",
                    minH: "24",
                    color: "inherit",
                    textDecoration: "none",
                    _hover: { borderColor: "primary.700" },
                  }),
                )}
                href={`/sellers/procedures/${slug}`}
                key={slug}
              >
                <div>
                  <div className={css({ fontSize: "md", fontWeight: "extrabold" })}>
                    {procedure.listTitle}
                  </div>
                  <span className={membershipRecipe({ needId: procedure.needId })}>
                    {procedure.needId ? "会員登録が必要です" : "会員登録は不要です"}
                  </span>
                </div>
                <span
                  className={css({ flexShrink: "0", fontSize: "2xl", color: "text.subtle" })}
                  aria-hidden="true"
                >
                  ›
                </span>
              </Link>
            );
          })}
        </div>

        <div className={cx(guideCardStyle, tileStyle, css({ mt: "5.5" }))}>
          <span
            className={css({
              display: "grid",
              placeItems: "center",
              flexShrink: "0",
              minW: "11",
              h: "11",
              px: "2",
              borderRadius: "button",
              bg: "primary.100",
              color: "primary.800",
              fontSize: "xl",
            })}
            aria-hidden="true"
          >
            ✉
          </span>
          <div>
            <div className={css({ fontSize: "md", fontWeight: "extrabold" })}>お問い合わせ</div>
            <div
              className={css({ mt: "1", fontSize: "sm", lineHeight: "prose", color: "text.muted" })}
            >
              お問い合わせはこちらまで
              <a href={`mailto:${CONTACT_EMAIL}`}>
                <b className={css({ color: "primary.800", fontSize: "md" })}>{CONTACT_EMAIL}</b>
              </a>
            </div>
          </div>
        </div>
      </div>
    </MockPageShell>
  );
}
