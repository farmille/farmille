import { notFound, redirect } from "next/navigation";

import { FormPageShell } from "@/components";
import { requireGeneralUser } from "@/server/auth";
import { errorMessageJa } from "@/server/errors";
import { purchaseChannelFromDatabase } from "@/server/mutations/reviews";
import { getReviewForEdit, listReviewCropOptions } from "@/server/queries/reviews";

import { loadMaterialOrNotFound } from "../../../material-page-data";
import { ReviewForm } from "../../_components/ReviewForm";

type EditReviewPageProps = {
  params: Promise<{ id: string; reviewId: string }>;
  searchParams: Promise<{ existing?: string | string[] }>;
};

export default async function EditReviewPage({ params, searchParams }: EditReviewPageProps) {
  const [{ id, reviewId }, requestedSearchParams] = await Promise.all([params, searchParams]);
  const materialPath = `/materials/${id}`;
  const editPath = `${materialPath}/review/${reviewId}/edit`;
  const session = await requireGeneralUser();

  if (!session.ok) {
    if (session.error === "unauthorized") {
      redirect(`/login?next=${encodeURIComponent(editPath)}`);
    }

    redirect(materialPath);
  }

  const material = await loadMaterialOrNotFound(id);
  const [reviewResult, cropsResult] = await Promise.all([
    getReviewForEdit(id, reviewId, session.data.userId),
    listReviewCropOptions(),
  ]);

  if (!reviewResult.ok) {
    if (reviewResult.error === "not_found") notFound();
    if (reviewResult.error === "forbidden") redirect(materialPath);
    throw new Error(errorMessageJa[reviewResult.error]);
  }
  if (!cropsResult.ok) {
    throw new Error(errorMessageJa[cropsResult.error]);
  }

  const review = reviewResult.data;

  return (
    <FormPageShell
      chrome="public"
      active="search"
      title={`${material.name}の感想口コミ編集`}
      backHref={materialPath}
    >
      <ReviewForm
        mode="edit"
        material={{
          id: material.id,
          name: material.name,
          manufacturerName: material.manufacturer_name,
        }}
        userId={session.data.userId}
        crops={cropsResult.data}
        reviewId={review.id}
        existingReviewNotice={requestedSearchParams.existing === "1"}
        initialValues={{
          cropIds: review.cropIds,
          rating: review.rating,
          body: review.body,
          purchaseChannel: purchaseChannelFromDatabase(review.purchase_channel),
          hasControlPlot: review.has_control_plot ?? false,
          pesticideAck: review.pesticide_ack,
          photos: review.photos,
        }}
      />
    </FormPageShell>
  );
}
