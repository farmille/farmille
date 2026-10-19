import type { User } from "@supabase/supabase-js";
import * as v from "valibot";

/**
 * 初回ログインの案内（docs/rebuild/onboarding-tour-SPEC.md）を待っているアカウントの印。
 * 一般会員の登録完了時に app_metadata.onboarding へ入れ、案内を終えたら消す。
 */
export const ONBOARDING_PENDING = "pending";

/** プロフィールを保存できたときだけ、マイページへ戻る URL に付ける。案内はこれを見て次の段階へ進む。 */
export const PROFILE_SAVED_SEARCH = "?saved=profile";

/** 案内の進み具合。案内中のブラウザの localStorage に、誰の進み具合かと合わせて置く。 */
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

const storedSchema = v.object({ step: v.picklist(onboardingSteps), userId: v.string() });

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
export function isMaterialPage(pathname: string): boolean {
  return materialPath.test(pathname);
}

/** 資材ページ以外から感想口コミの段階へ進むときに開く、投稿の入口（資材を選んで書く）。 */
export const REVIEW_ENTRY_HREF = "/post?type=review";
const reviewEntryPath = "/post";
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
    case "reviewIntro":
      return materialPath.test(pathname) || pathname === reviewEntryPath;
    case "finish":
      // 投稿画面のほか、感想口コミの段階をスキップしたときは、その資材ページか投稿の入口でも出す
      return (
        reviewFormPath.test(pathname) || materialPath.test(pathname) || pathname === reviewEntryPath
      );
    default:
      return true;
  }
}

/**
 * 「この手順をスキップ」で次の段階へ移るとき、その段階の案内が出る画面へ移る先。いまの画面のままでよければ null。
 */
export function onboardingSkipHref(next: OnboardingStep, pathname: string): string | null {
  if (next === "searchIntro") return pathname === "/search" ? null : "/search";
  if (next === "reviewIntro") return onboardingShowsOn(next, pathname) ? null : REVIEW_ENTRY_HREF;
  return null;
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

/** そのアカウントの進み具合だけを読む。共用のブラウザで、別のアカウントの進み具合を引き継がない。 */
export function readOnboardingStep(storage: Storage, userId: string): OnboardingStep | null {
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
  return parsed.output.userId === userId ? parsed.output.step : null;
}

export function writeOnboardingStep(storage: Storage, userId: string, step: OnboardingStep): void {
  storage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({ step, userId }));
}

export function clearOnboarding(storage: Storage): void {
  storage.removeItem(ONBOARDING_STORAGE_KEY);
}

/** 案内を出すのは、登録後に案内を終えていない一般会員だけ。Supabase Auth の利用者の app_metadata で判定する。 */
export function isOnboardingPending(user: User | null): boolean {
  if (user === null) return false;
  const metadata = user.app_metadata;
  return (
    v.is(v.literal("general"), metadata.account_type) &&
    v.is(v.literal(ONBOARDING_PENDING), metadata.onboarding)
  );
}
