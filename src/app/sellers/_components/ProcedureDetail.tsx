import Link from "next/link";

import { pageButtonStyles } from "@/app/company-requests/_components/button-styles";

import { css, cx } from "../../../../styled-system/css";
import {
  guideHeadingStyle,
  guideNarrowPageStyle,
  guideLeadStyle,
  guideTitleStyle,
  stepBodyRecipe,
  stepCardRecipe,
  stepLabelRecipe,
  stepLinkStyle,
} from "./guide-styles";
import { ProcedureRequirements } from "./ManufacturerLanding";
import type { Procedure } from "./manufacturer-guide";

const idBoxButtonStyle = css({ pc: { minW: "56" } });

export function ProcedureDetail({ procedure }: { procedure: Procedure }) {
  return (
    <div className={guideNarrowPageStyle}>
      <div className={css({ display: "flex", flexDirection: "column", gap: "3.5" })}>
        <div>
          <h1 className={guideTitleStyle}>{procedure.title}</h1>
          <p className={guideLeadStyle}>{procedure.lead}</p>
        </div>
        <div
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: "2.5",
            py: "4",
            px: "4.5",
            bg: "primary.soft",
            borderWidth: "1.5px",
            borderStyle: "solid",
            borderColor: "primary.700/35",
            borderRadius: "card",
            pc: {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "6",
              px: "5.5",
            },
          })}
        >
          <div className={css({ fontSize: "lg", fontWeight: "extrabold", color: "primary.800" })}>
            {procedure.needId ? "会員登録が必要です" : "会員登録は不要です"}
          </div>
          <div
            className={css({
              display: "flex",
              flexDirection: "column",
              gap: "2.5",
              pc: { flexDirection: "row" },
            })}
          >
            <Link
              className={cx(pageButtonStyles.primary, idBoxButtonStyle)}
              href={procedure.formHref}
            >
              {procedure.formLabel}
            </Link>
            {procedure.needId ? (
              <Link className={cx(pageButtonStyles.ghost, idBoxButtonStyle)} href="/sellers/apply">
                企業会員登録の申請
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <h2 className={guideHeadingStyle}>お手続きの流れ</h2>
      {procedure.steps.map((step, index) => (
        <article className={stepCardRecipe()} key={step.title}>
          <span className={stepLabelRecipe()}>STEP{index + 1}</span>
          <h3 className={css({ mt: "2", fontSize: "lg", fontWeight: "extrabold" })}>
            {step.title}
          </h3>
          <div className={stepBodyRecipe()}>{step.body}</div>
          {step.link === undefined ? null : (
            <Link className={stepLinkStyle} href={step.link.href}>
              {step.link.label}
            </Link>
          )}
        </article>
      ))}

      <h2 className={guideHeadingStyle}>対象となる企業様・ご準備いただくもの</h2>
      <div className={css({ mt: "3" })}>
        <ProcedureRequirements slug={procedure.slug} spacing="open" />
      </div>

      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "2.5",
          mt: "5.5",
          pc: { flexDirection: "row", "& > a": { flex: "1" } },
        })}
      >
        <Link className={pageButtonStyles.primary} href={procedure.formHref}>
          {procedure.formLabel}
        </Link>
        <Link className={pageButtonStyles.ghost} href="/sellers/procedures">
          お手続き一覧へ戻る
        </Link>
      </div>
    </div>
  );
}
