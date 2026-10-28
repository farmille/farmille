import { fn } from "storybook/test";
type Accounts = typeof import("@/server/accounts/registered-address");
export const getOwnRegisteredAddress = fn<Accounts["getOwnRegisteredAddress"]>(async () => ({
  ok: true,
  data: { prefectureCode: 8 },
}));
export const getOwnRegisteredContact = fn<Accounts["getOwnRegisteredContact"]>(async () => ({
  ok: true,
  data: {
    prefectureCode: 8,
    contact: {
      family_name: "山田",
      given_name: "太郎",
      phone: "09012345678",
      postal_code: "3100011",
      city_street: "水戸市三の丸1-1",
      building_name: null,
    },
  },
}));
