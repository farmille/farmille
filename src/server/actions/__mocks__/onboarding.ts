import { fn } from "storybook/test";

type Actions = typeof import("../onboarding");

export const finishOnboardingAction = fn<Actions["finishOnboardingAction"]>(async () => ({
  ok: true,
  data: null,
})).mockName("finishOnboardingAction");
