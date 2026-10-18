import type { Session } from "@supabase/supabase-js";
import * as v from "valibot";

/**
 * 初回ログインの案内（docs/rebuild/onboarding-tour-SPEC.md）の進み具合。
 * 登録完了画面を開いたブラウザの localStorage にだけ置き、サーバーには持たない。
 */
export const ONBOARDING_STORAGE_KEY = "farmille:onboarding";

export const onboardingSteps = [
  "welcome",
  "profileIntro",
  "profile",
  "profileSaving",
  "searchIntro",
  "search",
  "materialScroll",
  "reviewIntro",
  "reviewLink",
  "finish",
] as const;

export type OnboardingStep = (typeof onboardingSteps)[number];

const storedSchema = v.object({ step: v.picklist(onboardingSteps) });

/** 段階（1 プロフィール／2 資材の検索／3 感想口コミ）。ようこそと終了はどの段階にも入らない。 */
export type OnboardingSection = 0 | 1 | 2;

const sectionOf = {
  welcome: null,
  profileIntro: 0,
  profile: 0,
  profileSaving: 0,
  searchIntro: 1,
  search: 1,
  materialScroll: 1,
  reviewIntro: 2,
  reviewLink: 2,
  finish: null,
} satisfies Record<OnboardingStep, OnboardingSection | null>;

export function onboardingSection(step: OnboardingStep): OnboardingSection | null {
  return sectionOf[step];
}

/** 「この手順をスキップ」で移る先。いまの段階を飛ばして、次の段階の最初へ。 */
export function skipOnboardingSection(step: OnboardingStep): OnboardingStep {
  const section = sectionOf[step];
  if (section === 0) return "searchIntro";
  if (section === 1) return "reviewIntro";
  return "finish";
}

const materialPath = /^\/materials\/[^/]+$/;
const reviewFormPath = /^\/materials\/[^/]+\/review\/(?:new|[^/]+\/edit)$/;

/** その段階の案内を、いまの画面で出してよいか。案内中にほかの画面へ移ったときは出さない。 */
export function onboardingShowsOn(step: OnboardingStep, pathname: string): boolean {
  switch (step) {
    case "profile":
      return pathname === "/me/edit";
    case "profileSaving":
      return pathname === "/me" || pathname === "/me/edit";
    case "search":
      return pathname === "/search";
    case "materialScroll":
    case "reviewLink":
      return materialPath.test(pathname);
    default:
      return true;
  }
}

/** 画面を移ったことで次へ進む段階（資材ページが開いた・投稿画面が開いた）。 */
export function onboardingStepAfterNavigation(
  step: OnboardingStep,
  pathname: string,
): OnboardingStep | null {
  if (step === "search" && materialPath.test(pathname)) return "materialScroll";
  // 投稿画面が開いたところで案内を終える（その後の入力と投稿は普段どおり）
  if (step === "reviewLink" && reviewFormPath.test(pathname)) return "finish";
  return null;
}

export function readOnboardingStep(storage: Storage): OnboardingStep | null {
  const raw = storage.getItem(ONBOARDING_STORAGE_KEY);
  if (raw === null) return null;
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    storage.removeItem(ONBOARDING_STORAGE_KEY);
    return null;
  }
  const parsed = v.safeParse(storedSchema, json);
  if (!parsed.success) {
    storage.removeItem(ONBOARDING_STORAGE_KEY);
    return null;
  }
  return parsed.output.step;
}

export function writeOnboardingStep(storage: Storage, step: OnboardingStep): void {
  storage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({ step }));
}

export function clearOnboarding(storage: Storage): void {
  storage.removeItem(ONBOARDING_STORAGE_KEY);
}

/** 案内を出すのは一般会員だけ。Supabase のセッション（auth.getSession の結果）の利用者区分で判定する。 */
export function isGeneralSession(session: Session | null): boolean {
  if (session === null) return false;
  return v.is(v.literal("general"), session.user.app_metadata.account_type);
}
