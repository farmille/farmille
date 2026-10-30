import { fn } from "storybook/test";
import { savedMaterials, compareMaterials } from "@/app/me/_components/story-fixtures";

export const isMaterialSaved = fn<
  typeof import("@/server/queries/saved-materials").isMaterialSaved
>(async () => ({ ok: true, data: false })).mockName("isMaterialSaved");

export const toggleSavedMaterial = fn<
  typeof import("@/server/queries/saved-materials").toggleSavedMaterial
>(async () => ({ ok: true, data: false })).mockName("toggleSavedMaterial");

export const listSavedMaterials = fn<
  typeof import("@/server/queries/saved-materials").listSavedMaterials
>(async () => ({ ok: true, data: savedMaterials })).mockName("listSavedMaterials");

export const unsaveMaterial = fn<typeof import("@/server/queries/saved-materials").unsaveMaterial>(
  async () => ({ ok: true, data: null }),
).mockName("unsaveMaterial");

export const listMaterialsForCompare = fn<
  typeof import("@/server/queries/saved-materials").listMaterialsForCompare
>(async () => ({ ok: true, data: compareMaterials })).mockName("listMaterialsForCompare");
