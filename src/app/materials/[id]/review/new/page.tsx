import { notFound, redirect } from "next/navigation";

import { SitePageShell } from "@/app/_site/SitePageShell";
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
  if (material.publication_status !== "published") notFound();
  const [cropsResult, existingResult] = await Promise.all([
    listReviewCropOptions(),
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
    <SitePageShell title={`${material.name} の感想口コミ投稿`} backHref={materialPath}>
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
          pesticideAck: false,
          photos: [],
        }}
      />
    </SitePageShell>
  );
}
