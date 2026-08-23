import { redirect } from "next/navigation";

import { FormPageShell } from "@/components";
import { requireGeneralUser } from "@/server/auth";
import { errorMessageJa } from "@/server/errors";
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
  const [cropsResult, existingResult] = await Promise.all([
    listReviewCropOptions(session.data.userId),
    findOwnReviewIdByMaterial(id, session.data.userId),
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
      title={`${material.name}のレビュー`}
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
        initialValues={{
          cropIds: [],
          rating: 0,
          body: "",
          purchaseChannel: null,
          hasControlPlot: false,
          pesticideAck: false,
          photos: [],
        }}
      />
    </FormPageShell>
  );
}
