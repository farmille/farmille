import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { css } from "../../../../../../styled-system/css";
import { AppBar } from "@/components/app-bar";
import { errorMessageJa } from "@/server/errors";
import { requireGeneralUser } from "@/server/auth";
import { getUsageReportFormData } from "@/server/queries/usage-report-form";

import { loadMaterialOrNotFound, materialMetadata } from "../../material-page-data";
import { ReportForm } from "../_components/report-form";
import { ReportSubmitted } from "../_components/report-submitted";

type ReportFormPageProps = {
  params: Promise<{ id: string }>;
};

const shell = css({
  minH: "100dvh",
  maxW: "430px",
  mx: "auto",
  bg: "surface.panel",
  pb: "8",
});

const main = css({ px: "3.5", py: "4" });

export async function generateMetadata({ params }: ReportFormPageProps): Promise<Metadata> {
  const { id } = await params;
  const material = await loadMaterialOrNotFound(id);
  return materialMetadata(material, {
    titleSuffix: "の使用レポートを投稿",
    description: `${material.name}を使った条件と観察結果を使用レポートとして投稿します。`,
    pathSuffix: "/report/new",
  });
}

export default async function ReportFormPage({ params }: ReportFormPageProps) {
  const { id } = await params;
  const reportPath = `/materials/${id}/report/new`;
  const session = await requireGeneralUser();

  if (!session.ok) {
    if (session.error === "unauthorized") {
      redirect(`/login?next=${encodeURIComponent(reportPath)}`);
    }
    throw new Error(errorMessageJa[session.error]);
  }

  const [material, formDataResult] = await Promise.all([
    loadMaterialOrNotFound(id),
    getUsageReportFormData(id, session.data.userId),
  ]);

  if (!formDataResult.ok) {
    throw new Error(errorMessageJa[formDataResult.error]);
  }

  const formData = formDataResult.data;
  return (
    <div className={shell}>
      <AppBar title="使用結果入力" backHref={`/materials/${material.id}`} />
      {formData.submitted.length > 0 ? (
        <ReportSubmitted materialId={material.id} reports={formData.submitted} />
      ) : (
        <main className={main}>
          <ReportForm
            material={{
              id: material.id,
              name: material.name,
              manufacturerName: material.manufacturer_name,
              isOfficial: material.seller_id !== null,
              imageUrl: material.images[0]?.url ?? null,
            }}
            userId={session.data.userId}
            crops={formData.crops}
            draft={formData.draft}
            initialMonth={new Date().toISOString().slice(0, 7)}
          />
        </main>
      )}
    </div>
  );
}
