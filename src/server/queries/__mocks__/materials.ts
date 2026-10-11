import { fn } from "storybook/test";
import { materialDetail, relatedMaterials } from "@/app/materials/[id]/_components/story-fixtures";
export const listRelatedMaterials = fn<
  typeof import("@/server/queries/materials").listRelatedMaterials
>(async () => ({ ok: true, data: relatedMaterials })).mockName("listRelatedMaterials");
export const getMaterial = fn<typeof import("@/server/queries/materials").getMaterial>(
  async () => ({ ok: true, data: materialDetail }),
).mockName("getMaterial");
export const searchPostingMaterials = fn<
  typeof import("@/server/queries/materials").searchPostingMaterials
>(async () => ({ ok: true, data: relatedMaterials })).mockName("searchPostingMaterials");
export const withPostingMaterialImages = fn<
  typeof import("@/server/queries/materials").withPostingMaterialImages
>(async () => ({ ok: true, data: relatedMaterials })).mockName("withPostingMaterialImages");
