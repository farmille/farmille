import { fn } from "storybook/test";

// Storybook では Google の script を読み込まない。
type RecaptchaClient = typeof import("@/lib/recaptcha-client");

export const loadRecaptcha = fn<RecaptchaClient["loadRecaptcha"]>(async () => undefined).mockName(
  "loadRecaptcha",
);

export const executeRecaptcha = fn<RecaptchaClient["executeRecaptcha"]>(
  async () => "storybook-token",
).mockName("executeRecaptcha");
