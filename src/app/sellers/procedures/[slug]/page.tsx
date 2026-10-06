import "../../../_mock/sellers.css";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MockPageShell } from "@/app/_mock/MockPageShell";
import { createPageMetadata } from "@/lib/seo";

import { ProcedureRequirements } from "../../_components/ManufacturerLanding";
import {
  isProcedureSlug,
  PROCEDURE_ORDER,
  PROCEDURES,
  type Procedure,
} from "../../_components/manufacturer-guide";

export const dynamicParams = false;

export function generateStaticParams(): Array<{ slug: string }> {
  return PROCEDURE_ORDER.map((slug) => ({ slug }));
}

type ProcedurePageProps = { params: Promise<{ slug: string }> };

async function procedureOf(params: ProcedurePageProps["params"]): Promise<Procedure> {
  const { slug } = await params;
  if (!isProcedureSlug(slug)) notFound();
  return PROCEDURES[slug];
}

export async function generateMetadata({ params }: ProcedurePageProps): Promise<Metadata> {
  const procedure = await procedureOf(params);
  return createPageMetadata({
    title: procedure.title,
    description: procedure.lead,
    path: `/sellers/procedures/${procedure.slug}`,
  });
}

/**
 * お手続きの詳細。見本に単独の画面はなく、見本 PROCS（流れ・対象となる企業様・ご準備いただくもの）の内容を
 * 見本の .slp 部品（slp-stepcard・gd-c・slp-idbox）で並べる。申請の入口は本番の申請フォーム。
 */
export default async function ProcedurePage({ params }: ProcedurePageProps) {
  const procedure = await procedureOf(params);

  return (
    <MockPageShell title={procedure.title} backHref="/sellers/procedures">
      <div className="slp" style={{ maxWidth: 820, marginLeft: "auto", marginRight: "auto" }}>
        <div className="slp-head2">
          <div>
            <h1 style={{ fontSize: 20, lineHeight: 1.45 }}>{procedure.title}</h1>
            <p className="slp-sub" style={{ marginTop: 8 }}>
              {procedure.lead}
            </p>
          </div>
          <div className="slp-idbox">
            <div className="t">
              {procedure.needId ? "会員登録が必要です" : "会員登録は不要です"}
            </div>
            <div className="btns">
              <Link className="btn btn-primary" href={procedure.formHref}>
                {procedure.formLabel}
              </Link>
              {procedure.needId ? (
                <Link className="btn btn-ghost" href="/sellers/apply">
                  企業会員登録の申請
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <h2 className="slp-h2">お手続きの流れ</h2>
        {procedure.steps.map((step, index) => (
          <article className="slp-stepcard" key={step.title}>
            <span className="st">STEP{index + 1}</span>
            <h3 className="t">{step.title}</h3>
            <div className="d">{step.body}</div>
            {step.link === undefined ? null : (
              <Link className="lk" href={step.link.href}>
                {step.link.label}
              </Link>
            )}
          </article>
        ))}

        <h2 className="slp-h2">対象となる企業様・ご準備いただくもの</h2>
        <div className="gd" style={{ borderTop: "none" }}>
          <ProcedureRequirements slug={procedure.slug} open />
        </div>

        <div className="proc-actions">
          <Link className="btn btn-primary" href={procedure.formHref}>
            {procedure.formLabel}
          </Link>
          <Link className="btn btn-ghost" href="/sellers/procedures">
            お手続き一覧へ戻る
          </Link>
        </div>
      </div>
    </MockPageShell>
  );
}
