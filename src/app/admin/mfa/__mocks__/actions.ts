import { fn } from "storybook/test";

type Actions = typeof import("../actions");

export const startTotpEnrollmentAction = fn<Actions["startTotpEnrollmentAction"]>(async () => ({
  status: "error",
  message: "Storybook では認証アプリとの連携を行いません。",
}));

export const verifyTotpCodeAction = fn<Actions["verifyTotpCodeAction"]>(async () => ({
  status: "error",
  message: "Storybook では認証コードを送信しません。",
}));
