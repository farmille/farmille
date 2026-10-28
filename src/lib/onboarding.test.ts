import type { User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import {
  ONBOARDING_STORAGE_KEY,
  clearOnboarding,
  isOnboardingPending,
  onboardingFinishHref,
  onboardingShowsOn,
  onboardingSkipHref,
  onboardingStepAfterNavigation,
  readOnboardingStep,
  skipOnboardingSection,
  writeOnboardingStep,
} from "./onboarding";

function userOf(appMetadata: Record<string, string>): User {
  return {
    id: "user-1",
    aud: "authenticated",
    created_at: "2026-10-17T00:00:00Z",
    app_metadata: appMetadata,
    user_metadata: {},
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
    expect(readOnboardingStep(storage, "user-1")).toBeNull();
    writeOnboardingStep(storage, "user-1", "search");
    expect(readOnboardingStep(storage, "user-1")).toBe("search");
    clearOnboarding(storage);
    expect(readOnboardingStep(storage, "user-1")).toBeNull();
  });

  it("別のアカウントの進み具合は読まない", () => {
    const storage = memoryStorage();
    writeOnboardingStep(storage, "user-1", "finish");
    expect(readOnboardingStep(storage, "user-2")).toBeNull();
    expect(readOnboardingStep(storage, "user-1")).toBe("finish");
  });

  it("壊れた値や知らない段階は捨てる", () => {
    const storage = memoryStorage();
    storage.setItem(ONBOARDING_STORAGE_KEY, "{");
    expect(readOnboardingStep(storage, "user-1")).toBeNull();
    expect(storage.getItem(ONBOARDING_STORAGE_KEY)).toBeNull();
    storage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({ step: "unknown" }));
    expect(readOnboardingStep(storage, "user-1")).toBeNull();
  });

  it("段階ごとの画面でだけ案内を出す", () => {
    expect(onboardingShowsOn("profile", "/me/edit")).toBe(true);
    expect(onboardingShowsOn("profile", "/search")).toBe(false);
    expect(onboardingShowsOn("search", "/search")).toBe(true);
    expect(onboardingShowsOn("reviewLink", "/materials/abc")).toBe(true);
    expect(onboardingShowsOn("reviewLink", "/materials/abc/review/new")).toBe(false);
    expect(onboardingShowsOn("welcome", "/")).toBe(true);
    expect(onboardingShowsOn("finish", "/materials/abc/review/new")).toBe(true);
    expect(onboardingShowsOn("finish", "/materials/abc")).toBe(true);
    expect(onboardingShowsOn("finish", "/")).toBe(false);
    expect(onboardingShowsOn("reviewIntro", "/materials/abc")).toBe(true);
    expect(onboardingShowsOn("reviewIntro", "/")).toBe(false);
  });

  it("スキップした先の段階の案内が出る画面へ移る", () => {
    expect(onboardingSkipHref("searchIntro", "/me/edit")).toBe("/search");
    expect(onboardingSkipHref("searchIntro", "/search")).toBeNull();
    expect(onboardingSkipHref("reviewIntro", "/search")).toBe("/post?type=review");
    expect(onboardingSkipHref("reviewIntro", "/materials/abc")).toBeNull();
    expect(onboardingSkipHref("finish", "/materials/abc")).toBeNull();
    expect(onboardingShowsOn("reviewIntro", "/post")).toBe(true);
    expect(onboardingShowsOn("finish", "/post")).toBe(true);

    {
      expect(skipOnboardingSection("profile")).toBe("searchIntro");
      expect(skipOnboardingSection("materialScroll")).toBe("reviewIntro");
      expect(skipOnboardingSection("reviewLink")).toBe("finish");
    }
  });

  it("資材ページや投稿画面が開いたら次の段階へ進む", () => {
    expect(onboardingStepAfterNavigation("search", "/materials/abc")).toBe("materialScroll");
    expect(onboardingStepAfterNavigation("search", "/search")).toBeNull();
    expect(onboardingStepAfterNavigation("reviewLink", "/materials/abc/review/new")).toBe("finish");
    expect(onboardingStepAfterNavigation("reviewLink", "/materials/abc/review/r1/edit")).toBe(
      "finish",
    );
  });

  it("案内の途中で自分から投稿画面を開いたときも、終了へ進む", () => {
    for (const step of [
      "searchIntro",
      "search",
      "materialScroll",
      "reviewIntro",
      "reviewLink",
    ] as const) {
      expect(onboardingStepAfterNavigation(step, "/materials/abc/review/new")).toBe("finish");
    }
    expect(onboardingStepAfterNavigation("materialScroll", "/materials/abc")).toBeNull();
    expect(onboardingStepAfterNavigation("materialScroll", "/search")).toBeNull();
  });

  it("プロフィールまでの段階と終了は、投稿画面が開いても動かさない", () => {
    for (const step of ["welcome", "profileIntro", "profile", "profileSaving", "finish"] as const) {
      expect(onboardingStepAfterNavigation(step, "/materials/abc/review/new")).toBeNull();
    }
  });

  it("投稿画面で最後のシートを閉じたら、その資材の資材ページへ移る", () => {
    expect(onboardingFinishHref("/materials/abc/review/new")).toBe("/materials/abc");
    expect(onboardingFinishHref("/materials/abc/review/r1/edit")).toBe("/materials/abc");
  });

  it("資材ページと投稿の入口で最後のシートを閉じたら、いまの画面のまま終える", () => {
    expect(onboardingFinishHref("/materials/abc")).toBeNull();
    expect(onboardingFinishHref("/post")).toBeNull();
  });

  it("案内を終えていない一般会員だけを案内の対象にする", () => {
    expect(isOnboardingPending(userOf({ account_type: "general", onboarding: "pending" }))).toBe(
      true,
    );
    expect(isOnboardingPending(userOf({ account_type: "general" }))).toBe(false);
    expect(isOnboardingPending(userOf({ account_type: "seller", onboarding: "pending" }))).toBe(
      false,
    );
    expect(isOnboardingPending(null)).toBe(false);
  });
});
