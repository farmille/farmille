import { notFound, redirect } from "next/navigation";

import { FormPageShell } from "@/components";
import { getViewerAccount } from "@/components/SiteAppBar";
import { pesticideRegistrationOf } from "@/lib/material-page-editor";
import { requireGeneralUser } from "@/server/auth";
import { errorMessageJa } from "@/server/errors";
import { getPublishedMaterialPage } from "@/server/material-page-editor";
import { REVIEW_BODY_MAX_LENGTH } from "@/server/mutations/reviews";
import { findOwnReviewIdByMaterial, listReviewCropOptions } from "@/server/queries/reviews";

import { loadMaterialOrNotFound } from "../../material-page-data";
import { ReviewForm } from "../_components/ReviewForm";

type NewReviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function NewReviewPage({ params }: NewReviewPageProps) {
  const { id } = await params;
  const materialPath = `/materials/${id}`;
  const session = await requireGeneralUser();

  if (!session.ok) {
    if (session.error === "unauthorized") {
      redirect(`/login?next=${encodeURIComponent(`${materialPath}/review/new`)}`);
    }

    redirect(materialPath);
  }

  const material = await loadMaterialOrNotFound(id);

  if (material.publication_status !== "published") notFound();

  const [cropsResult, existingResult, account, publishedPage] = await Promise.all([
    listReviewCropOptions(),
    findOwnReviewIdByMaterial(id, session.data.userId),
    getViewerAccount(),
    getPublishedMaterialPage(id),
  ]);

  if (!cropsResult.ok) {
    throw new Error(errorMessageJa[cropsResult.error]);
  }

  if (!existingResult.ok) {
    throw new Error(errorMessageJa[existingResult.error]);
  }

  if (existingResult.data !== null) {
    redirect(`${materialPath}/review/${existingResult.data}/edit?existing=1`);
  }

  return (
    <FormPageShell
      chrome="public"
      active="search"
      account={account}
      title={`${material.name}の感想口コミ`}
      backHref={materialPath}
    >
      <ReviewForm
        mode="create"
        material={{
          id: material.id,
          name: material.name,
          manufacturerName: material.manufacturer_name,
        }}
        userId={session.data.userId}
        crops={cropsResult.data}
        targetCropIds={material.targetCrops.map((crop) => crop.id)}
        pesticideRegistration={pesticideRegistrationOf(
          publishedPage === null ? null : publishedPage.content.registrations,
        )}
        bodyMaxLength={REVIEW_BODY_MAX_LENGTH}
        initialValues={{
          cropIds: [],
          rating: 0,
          body: "",
          pesticideAck: false,
          photos: [],
        }}
      />
    </FormPageShell>
  );
}
