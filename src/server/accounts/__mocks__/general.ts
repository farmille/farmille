import { fn } from "storybook/test";

type Accounts = typeof import("../general");

export const getRegistrationIdentity = fn<Accounts["getRegistrationIdentity"]>(async () => ({
  ok: true,
  data: { userId: "00000000-0000-4000-8000-000000000701", email: "farmer@example.test" },
}));

export const getOwnRegisteredDetails = fn<Accounts["getOwnRegisteredDetails"]>(async () => ({
  ok: true,
  data: {
    email: "farmer@example.test",
    familyName: "山田",
    givenName: "花子",
    phone: "09012345678",
    postalCode: "3100011",
    prefectureCode: 8,
    cityStreet: "水戸市三の丸1-2-3",
    buildingName: "",
  },
}));

export const saveOwnRegisteredDetails = fn<Accounts["saveOwnRegisteredDetails"]>(async () => ({
  ok: true,
  data: { userId: "00000000-0000-4000-8000-000000000701" },
}));

export const withdrawOwnAccount = fn<Accounts["withdrawOwnAccount"]>(async () => ({
  ok: true,
  data: null,
}));
