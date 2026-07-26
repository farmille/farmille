import { notFound, redirect } from "next/navigation";

import { FormPageShell } from "@/components";
import { requireGeneralUser } from "@/server/auth";
import { errorMessageJa } from "@/server/errors";
import type { PurchaseChannel } from "@/server/mutations/reviews";
import { getReviewForEdit, listReviewCropOptions } from "@/server/queries/reviews";

import { loadMaterialOrNotFound } from "../../../material-page-data";
import { ReviewForm } from "../../_components/review-form";

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
    listReviewCropOptions(session.data.userId),
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
    <FormPageShell title={`${material.name}のレビュー編集`} backHref={materialPath}>
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
          cropId: review.crop_id,
          rating: review.rating,
          body: review.body,
          purchaseChannel: review.purchase_channel as PurchaseChannel | null,
          hasControlPlot: review.has_control_plot ?? false,
          pesticideAck: review.pesticide_ack,
          photos: review.photos,
        }}
      />
    </FormPageShell>
  );
}
