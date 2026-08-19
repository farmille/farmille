"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { errorMessageJa } from "@/server/errors";
import { requireGeneralUser } from "@/server/auth";
import { unsaveMaterial } from "@/server/queries/saved-materials";

export async function unsaveMaterialAction(materialId: string, _formData: FormData): Promise<void> {
  const session = await requireGeneralUser();

  if (!session.ok) {
    if (session.error === "unauthorized") {
      redirect(`/login?next=${encodeURIComponent("/me/saved")}`);
    }

    throw new Error(errorMessageJa[session.error]);
  }

  const result = await unsaveMaterial(materialId, session.data.userId);

  if (!result.ok) {
    throw new Error(errorMessageJa[result.error]);
  }

  revalidatePath("/me");
  revalidatePath("/me/saved");
  revalidatePath(`/materials/${materialId}`);
}
