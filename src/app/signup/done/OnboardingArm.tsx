"use client";

import { useEffect } from "react";

import { readOnboardingStep, writeOnboardingStep } from "@/lib/onboarding";

/**
 * 登録完了画面を開いたブラウザに、初回ログインの案内を出す印を残す（docs/rebuild/onboarding-tour-SPEC.md）。
 * 案内の途中で開き直しても、進み具合は巻き戻さない。
 */
export function OnboardingArm() {
  useEffect(() => {
    if (readOnboardingStep(window.localStorage) === null) {
      writeOnboardingStep(window.localStorage, "welcome");
    }
  }, []);
  return null;
}
