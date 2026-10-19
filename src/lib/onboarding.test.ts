import type { Session } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import {
  ONBOARDING_STORAGE_KEY,
  clearOnboarding,
  isOnboardingPending,
  onboardingShowsOn,
  onboardingStepAfterNavigation,
  readOnboardingStep,
  skipOnboardingSection,
  writeOnboardingStep,
} from "./onboarding";

function sessionOf(appMetadata: Record<string, string>): Session {
  return {
    access_token: "token",
    refresh_token: "refresh",
    expires_in: 3600,
    token_type: "bearer",
    user: {
      id: "user-1",
      aud: "authenticated",
      created_at: "2026-10-17T00:00:00Z",
      app_metadata: appMetadata,
      user_metadata: {},
    },
  };
}

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe("初回ログインの案内の進み具合", () => {
  it("書いた段階を読み戻し、終了で消す", () => {
    const storage = memoryStorage();
    expect(readOnboardingStep(storage)).toBeNull();
    writeOnboardingStep(storage, "search");
    expect(readOnboardingStep(storage)).toBe("search");
    clearOnboarding(storage);
    expect(readOnboardingStep(storage)).toBeNull();
  });

  it("壊れた値や知らない段階は捨てる", () => {
    const storage = memoryStorage();
    storage.setItem(ONBOARDING_STORAGE_KEY, "{");
    expect(readOnboardingStep(storage)).toBeNull();
    expect(storage.getItem(ONBOARDING_STORAGE_KEY)).toBeNull();
    storage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({ step: "unknown" }));
    expect(readOnboardingStep(storage)).toBeNull();
  });

  it("この手順をスキップは、次の段階の最初へ移る", () => {
    expect(skipOnboardingSection("profile")).toBe("searchIntro");
    expect(skipOnboardingSection("materialScroll")).toBe("reviewIntro");
    expect(skipOnboardingSection("reviewLink")).toBe("finish");
  });

  it("段階ごとの画面でだけ案内を出す", () => {
    expect(onboardingShowsOn("profile", "/me/edit")).toBe(true);
    expect(onboardingShowsOn("profile", "/search")).toBe(false);
    expect(onboardingShowsOn("search", "/search")).toBe(true);
    expect(onboardingShowsOn("reviewLink", "/materials/abc")).toBe(true);
    expect(onboardingShowsOn("reviewLink", "/materials/abc/review/new")).toBe(false);
    expect(onboardingShowsOn("welcome", "/")).toBe(true);
    expect(onboardingShowsOn("finish", "/materials/abc/review/new")).toBe(true);
    expect(onboardingShowsOn("finish", "/materials/abc")).toBe(false);
    expect(onboardingShowsOn("finish", "/")).toBe(false);
  });

  it("資材ページや投稿画面が開いたら次の段階へ進む", () => {
    expect(onboardingStepAfterNavigation("search", "/materials/abc")).toBe("materialScroll");
    expect(onboardingStepAfterNavigation("search", "/search")).toBeNull();
    expect(onboardingStepAfterNavigation("reviewLink", "/materials/abc/review/new")).toBe("finish");
    expect(onboardingStepAfterNavigation("reviewLink", "/materials/abc/review/r1/edit")).toBe(
      "finish",
    );
  });

  it("案内を終えていない一般会員のセッションだけを案内の対象にする", () => {
    expect(isOnboardingPending(sessionOf({ account_type: "general", onboarding: "pending" }))).toBe(
      true,
    );
    expect(isOnboardingPending(sessionOf({ account_type: "general" }))).toBe(false);
    expect(isOnboardingPending(sessionOf({ account_type: "seller", onboarding: "pending" }))).toBe(
      false,
    );
    expect(isOnboardingPending(null)).toBe(false);
  });
});
