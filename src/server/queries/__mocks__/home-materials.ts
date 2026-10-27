import { fn } from "storybook/test";
import { relatedMaterials } from "@/app/materials/[id]/_components/story-fixtures";
export const listHomeMaterials = fn<
  typeof import("@/server/queries/home-materials").listHomeMaterials
>(async () =>
  relatedMaterials.map((material) => ({
    ...material,
    categories: [{ name: "微生物", short_name: "微生物" }],
  })),
).mockName("listHomeMaterials");
