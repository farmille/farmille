import { fn } from "storybook/test";

type Actions = typeof import("../postal-action");

export const findPostalAddress = fn<Actions["findPostalAddress"]>(async () => ({
  ok: true,
  addresses: [{ prefectureCode: 13, city: "千代田区", town: "千代田" }],
}));
