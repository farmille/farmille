import { fn } from "storybook/test";
export const getOwnRegisteredAddress = fn<
  typeof import("@/server/accounts/registered-address").getOwnRegisteredAddress
>(async () => ({ ok: true, data: { prefectureCode: 8, city: "水戸市" } }));
