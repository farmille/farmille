import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FormPageShell } from "@/components/FormPageShell";
import { createPageMetadata } from "@/lib/seo";

import { ProcedureDetail } from "../../_components/ProcedureDetail";
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

export default async function ProcedurePage({ params }: ProcedurePageProps) {
  const procedure = await procedureOf(params);

  return (
    <FormPageShell chrome="public" title={procedure.title} backHref="/sellers/procedures">
      <ProcedureDetail procedure={procedure} />
    </FormPageShell>
  );
}
