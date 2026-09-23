import { fn } from "storybook/test";
type Actions = typeof import("../actions");
export const submitApplication = fn<Actions["submitApplication"]>(async () => ({
  ok: true,
  data: "11111111-1111-4111-8111-111111111111",
}));
export const retryApplicationMail = fn<Actions["retryApplicationMail"]>(async () => ({
  ok: true,
  data: true,
}));
export const requestVerification = fn<Actions["requestVerification"]>(async () => ({
  ok: true,
  data: true,
}));
export const requestReceiptVerification = fn<Actions["requestReceiptVerification"]>(async () => ({
  ok: true,
  data: true,
}));
export const reserveEvidence = fn<Actions["reserveEvidence"]>(async () => ({
  ok: false,
  error: "internal",
}));
export const finalizeEvidence = fn<Actions["finalizeEvidence"]>(async () => ({
  ok: true,
  data: true,
}));
export const removeEvidence = fn<Actions["removeEvidence"]>(async () => ({ ok: true, data: true }));

export const restartRemoval = fn<Actions["restartRemoval"]>(async () => ({
  ok: true,
  data: "11111111-1111-4111-8111-111111111111",
}));
