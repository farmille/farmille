import { fn } from "storybook/test";

type Actions = typeof import("../onboarding");

export const finishOnboardingAction = fn<Actions["finishOnboardingAction"]>(
  async () => {},
).mockName("finishOnboardingAction");
