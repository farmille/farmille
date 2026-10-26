import { SiteAppBar } from "@/components/SiteAppBar";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { css } from "../../../../../../styled-system/css";

import { getOwnRegisteredAddress } from "@/server/accounts/registered-address";
import { errorMessageJa } from "@/server/errors";
import { requireGeneralUser } from "@/server/auth";
import { getOwnProfile } from "@/server/queries/profiles";
import { getStructuredReportFormData } from "@/server/usage-reports/structured";

import { loadMaterialOrNotFound, materialMetadata } from "../../material-page-data";
import { ReportPageForm } from "../_components/ReportPageForm";
import { ReportSubmitted } from "../_components/ReportSubmitted";

type ReportFormPageProps = {
  params: Promise<{ id: string }>;
};

const shell = css({
  minH: "dvh",
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

  const [material, formDataResult, addressResult, profileResult] = await Promise.all([
    loadMaterialOrNotFound(id),
    getStructuredReportFormData(id, session.data.userId),
    getOwnRegisteredAddress(),
    getOwnProfile(session.data.userId),
  ]);

  if (!formDataResult.ok) {
    throw new Error(errorMessageJa[formDataResult.error]);
  }
  if (!addressResult.ok) {
    throw new Error(errorMessageJa[addressResult.error]);
  }
  if (!profileResult.ok) {
    throw new Error(errorMessageJa[profileResult.error]);
  }
  if (material.publication_status !== "published") notFound();

  const formData = formDataResult.data;
  if (formData.submitted.length > 0) {
    return (
      <div className={shell}>
        <SiteAppBar
          chrome="public"
          active="post"
          title="実証詳細レポート"
          backHref={`/materials/${material.id}`}
        />
        <ReportSubmitted materialId={material.id} reports={formData.submitted} />
      </div>
    );
  }

  return (
    <main>
      <ReportPageForm
        material={{
          id: material.id,
          name: material.name,
          manufacturerName: material.manufacturer_name,
        }}
        userId={session.data.userId}
        authorName={profileResult.data.handle}
        crops={formData.crops}
        draft={formData.draft}
        documentUrls={formData.documentUrls}
        effects={formData.effects}
        materialEffectNames={material.effects.map((effect) => effect.name)}
        favoriteCropIds={formData.favoriteCropIds}
        materialCropIds={formData.materialCropIds}
        registeredAddress={addressResult.data}
      />
    </main>
  );
}
