"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isMaterialId } from "@/app/materials/[id]/material-page-data";
import { errorMessageJa } from "@/server/errors";
import { requireGeneralUser } from "@/server/auth";
import { toggleSavedMaterial } from "@/server/queries/saved-materials";

export async function toggleSavedMaterialAction(
  materialId: string,
  _formData: FormData,
): Promise<void> {
  const materialPath = `/materials/${materialId}`;

  if (!isMaterialId(materialId)) {
    throw new Error(errorMessageJa.not_found);
  }

  const session = await requireGeneralUser();

  if (!session.ok) {
    if (session.error === "unauthorized") {
      redirect(`/login?next=${encodeURIComponent(materialPath)}`);
    }

    throw new Error(errorMessageJa[session.error]);
  }

  const result = await toggleSavedMaterial(materialId, session.data.userId);

  if (!result.ok) {
    throw new Error(errorMessageJa[result.error]);
  }

  revalidatePath(materialPath);
}
