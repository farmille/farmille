import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { css } from "../../../../../../styled-system/css";
import { AppBar } from "@/components/AppBar";
import { errorMessageJa } from "@/server/errors";
import { requireGeneralUser } from "@/server/auth";
import { getUsageReportFormData } from "@/server/queries/usage-report-form";

import { loadMaterialOrNotFound, materialMetadata } from "../../material-page-data";
import { ReportForm } from "../_components/ReportForm";
import { ReportSubmitted } from "../_components/ReportSubmitted";

type ReportFormPageProps = {
  params: Promise<{ id: string }>;
};

const shell = css({
  minH: "100dvh",
  bg: "surface.page",
  pb: "8",
});

const main = css({
  w: "100%",
  maxW: "content.form",
  mx: "auto",
  px: "3.5",
  py: "4",
  bg: "surface.panel",
  tab: { px: "5", py: "5" },
});

export async function generateMetadata({ params }: ReportFormPageProps): Promise<Metadata> {
  const { id } = await params;
  const material = await loadMaterialOrNotFound(id);
  return materialMetadata(material, {
    titleSuffix: "の実証詳細レポートを投稿",
    description: `${material.name}を使った条件と観察結果を実証詳細レポートとして投稿します。`,
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
  if (material.publication_status !== "published") notFound();

  const formData = formDataResult.data;
  return (
    <div className={shell}>
      <AppBar
        chrome="public"
        active="post"
        title="使用結果入力"
        backHref={`/materials/${material.id}`}
      />
      {formData.submitted.length > 0 ? (
        <ReportSubmitted materialId={material.id} reports={formData.submitted} />
      ) : (
        <main className={main}>
          <ReportForm
            material={{
              id: material.id,
              name: material.name,
              manufacturerName: material.manufacturer_name,
              isOfficial: material.manufacturer_verified_at !== null,
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
