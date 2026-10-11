import { fn } from "storybook/test";
export const getProfileDetails = fn<
  typeof import("@/server/queries/profile-details").getProfileDetails
>(async () => ({
  ok: true,
  data: {
    cityPublic: false,
    affiliations: [],
    crops: [],
    links: [],
    standpoint: "farmer",
    prefecture_code: 8,
    bio: "茨城県でトマトと葉物を栽培しています。",
    city: "水戸市",
  },
})).mockName("getProfileDetails");
export const getProfileOptions = fn<
  typeof import("@/server/queries/profile-details").getProfileOptions
>(async () => ({
  ok: true,
  data: {
    crops: [
      {
        id: "00000000-0000-4000-8000-000000000304",
        name: "トマト",
        aliases: ["ミニトマト"],
        crop_groups: { name: "果菜類" },
      },
    ],
    affiliations: ["農業法人"],
  },
})).mockName("getProfileOptions");
export const saveProfileDetails = fn<
  typeof import("@/server/queries/profile-details").saveProfileDetails
>(async () => ({ ok: true, data: null })).mockName("saveProfileDetails");
