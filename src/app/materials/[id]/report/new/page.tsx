import "../../../../_mock/report-form.css";
import "../../../../_mock/report-form-extra.css";

import { createBlankUsageReport } from "@/lib/usage-report";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { css } from "../../../../../../styled-system/css";
import { AppBar } from "@/components/AppBar";
import { errorMessageJa } from "@/server/errors";
import { requireGeneralUser } from "@/server/auth";
import { getStructuredReportFormData } from "@/server/usage-reports/structured";

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
    getStructuredReportFormData(id, session.data.userId),
  ]);

  if (!formDataResult.ok) {
    throw new Error(errorMessageJa[formDataResult.error]);
  }
  if (material.publication_status !== "published") notFound();

  const formData = formDataResult.data;
  const initialDraft = formData.draft ?? {
    ...createBlankUsageReport(material.id),
    prefectureCode: formData.prefectureCode,
    city: formData.city,
  };
  if (formData.submitted.length > 0) {
    return (
      <div className={shell}>
        <AppBar
          chrome="public"
          active="post"
          title="実証詳細レポート"
          backHref={`/materials/${material.id}`}
        />
        <ReportSubmitted materialId={material.id} reports={formData.submitted} />
      </div>
    );
  }

  // 入力画面は見本（WIZ_SRC）どおり、ステッパー・下書き保存・閉じるを持つ専用の見出しだけの全画面にする。
  return (
    <main>
      <ReportForm
        material={{
          id: material.id,
          name: material.name,
          manufacturerName: material.manufacturer_name,
          imageUrl: material.images[0]?.url ?? null,
        }}
        userId={session.data.userId}
        crops={formData.crops}
        draft={initialDraft}
        effects={formData.effects}
        materialEffectNames={material.effects.map((effect) => effect.name)}
        favoriteCropIds={formData.favoriteCropIds}
        materialCropIds={formData.materialCropIds}
        prefectureCode={formData.prefectureCode}
        city={formData.city}
        initialDocumentUrls={formData.documentUrls}
      />
    </main>
  );
}
