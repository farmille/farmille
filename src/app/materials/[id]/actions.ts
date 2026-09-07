"use server";

import { redirect } from "next/navigation";

import { isMaterialId } from "@/app/materials/[id]/material-page-data";
import { errorMessageJa } from "@/server/errors";
import { requireGeneralUser } from "@/server/auth";
import { toggleSavedMaterial } from "@/server/queries/saved-materials";

export type SaveControlState = {
  saved: boolean;
};

/**
 * 検討リストの保存／解除。
 * 資材詳細は動的レンダリングでキャッシュを持たないため再検証はせず、
 * ボタンの表示は戻り値の saved を SaveControl 側で描画する。
 */
export async function toggleSavedMaterialAction(
  materialId: string,
  _previous: SaveControlState,
  _formData: FormData,
): Promise<SaveControlState> {
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

  return { saved: result.data };
}
