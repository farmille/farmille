import { fn } from "storybook/test";

export function isTagCategory(
  value: string | null | undefined,
): value is import("@/server/admin/tags").TagCategoryValue {
  return value === "concern" || value === "condition";
}

export const listAdminTags = fn<typeof import("@/server/admin/tags").listAdminTags>(async () => ({
  ok: true,
  data: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      name: "高温期の生育維持",
      sort_order: 3,
      category: "condition",
      usageCount: 3,
    },
  ],
})).mockName("listAdminTags");

export const createTag = fn<typeof import("@/server/admin/tags").createTag>(async () => ({
  ok: true,
  data: { id: "11111111-1111-4111-8111-111111111111" },
})).mockName("createTag");

export const renameTag = fn<typeof import("@/server/admin/tags").renameTag>(async () => ({
  ok: true,
  data: null,
})).mockName("renameTag");

export const deleteTag = fn<typeof import("@/server/admin/tags").deleteTag>(async () => ({
  ok: true,
  data: null,
})).mockName("deleteTag");

export const listCropGroups = fn<typeof import("@/server/admin/tags").listCropGroups>(async () => ({
  ok: true,
  data: [{ id: "11111111-1111-4111-8111-111111111111", name: "果菜類" }],
})).mockName("listCropGroups");

export const listAdminCrops = fn<typeof import("@/server/admin/tags").listAdminCrops>(async () => ({
  ok: true,
  data: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      name: "トマト",
      sort_order: 3,
      aliases: [],
      group_id: "11111111-1111-4111-8111-111111111111",
      groupName: "果菜類",
      usageCount: 3,
    },
  ],
})).mockName("listAdminCrops");

export const createCrop = fn<typeof import("@/server/admin/tags").createCrop>(async () => ({
  ok: true,
  data: { id: "11111111-1111-4111-8111-111111111111" },
})).mockName("createCrop");

export const renameCrop = fn<typeof import("@/server/admin/tags").renameCrop>(async () => ({
  ok: true,
  data: null,
})).mockName("renameCrop");

export const deleteCrop = fn<typeof import("@/server/admin/tags").deleteCrop>(async () => ({
  ok: true,
  data: null,
})).mockName("deleteCrop");

export const TAG_CATEGORIES: typeof import("@/server/admin/tags").TAG_CATEGORIES = [
  "concern",
  "condition",
];
