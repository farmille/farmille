"use client";
import { usePathname, useRouter } from "next/navigation";
import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useReducer,
  useSyncExternalStore,
} from "react";
import { createAuthBrowserClient } from "@/lib/auth/browser";
import {
  PROFILE_SAVED_SEARCH,
  clearOnboarding,
  isOnboardingPending,
  onboardingFinishHref,
  onboardingStepAfterNavigation,
  readOnboardingStep,
  writeOnboardingStep,
  type OnboardingStep,
} from "@/lib/onboarding";
import { finishOnboardingAction } from "@/server/actions/onboarding";
import { errorMessageJa } from "@/server/errors";
import { toast } from "@/components/Toaster";

// 案内の進み具合は localStorage に置き、同じタブの書き換えはこの購読者へ配る
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
// localStorage を使えないブラウザ（保存を拒否する設定など）では、進み具合を持てないので案内を出さない
function readStep(userId: string | null): OnboardingStep | null {
  if (userId === null) return null;
  try {
    return readOnboardingStep(window.localStorage, userId);
  } catch {
    return null;
  }
}
const readNothing = () => null;
function saveStep(userId: string, step: OnboardingStep | null) {
  try {
    if (step === null) clearOnboarding(window.localStorage);
    else writeOnboardingStep(window.localStorage, userId, step);
  } catch {
    return;
  }
  listeners.forEach((listener) => listener());
}

/**
 * 案内を待っているアカウントなら、その利用者の id を返す。
 * 手元のセッションは別の端末で案内を終えた後も古い印を持つので、印があるときはサーバーで今の利用者を確かめる。
 */
export async function pendingUserId(): Promise<string | null> {
  const auth = createAuthBrowserClient().auth;
  const { data } = await auth.getSession();
  if (!isOnboardingPending(data.session?.user ?? null)) return null;
  const { user } = (await auth.getUser()).data;
  return user !== null && isOnboardingPending(user) ? user.id : null;
}

/** data-tour の目印が画面に出るまで待つ（画面の移動直後や読み込み中は、まだない）。 */
export function useTourTarget(name: string | null): Element | null {
  const [found, setFound] = useReducer(
    (
      _current: { name: string; element: Element } | null,
      next: { name: string; element: Element } | null,
    ) => next,
    null,
  );
  useEffect(() => {
    if (name === null) return;
    const look = () => {
      const element = document.querySelector(`[data-tour="${name}"]`);
      if (element !== null) setFound({ name, element });
      return element !== null;
    };
    if (look()) return;
    const timer = window.setInterval(() => {
      if (look()) window.clearInterval(timer);
    }, 200);
    return () => window.clearInterval(timer);
  }, [name]);
  return name !== null && found?.name === name && found.element.isConnected ? found.element : null;
}

// 実証詳細レポートの見出しが画面の上から半分より上に来たら、見たものとして次へ進む
const SECTION_SEEN = 0.5;
const FINISH_FAILED = "チュートリアルを終了できませんでした。時間を置いて再度お試しください。";
// 最後のお礼を出しておく時間
const THANKS_SHOWN = 1600;

/**
 * 案内を終えた印をアカウントに残し、セッションを取り直してから、このブラウザの進み具合を消す。
 * 取り直す前に消すと、古いセッションの印を見て案内を最初から出し直してしまう。
 */
export async function finishOnboarding(userId: string): Promise<boolean> {
  try {
    const result = await finishOnboardingAction();
    if (!result.ok) {
      toast.error(errorMessageJa[result.error]);
      return false;
    }
  } catch {
    toast.error(FINISH_FAILED);
    return false;
  }
  const { error } = await createAuthBrowserClient().auth.refreshSession();
  if (error) {
    toast.error(FINISH_FAILED);
    return false;
  }
  saveStep(userId, null);
  return true;
}

export type OnboardingTourWithProps = {
  /** 案内を待っているアカウントなら、その利用者の id を返す。 */
  findPendingUser: () => Promise<string | null>;
  /** 案内を終えた印をアカウントとブラウザから消す。消せたら true。 */
  finish: (userId: string) => Promise<boolean>;
};

type OnboardingCompletion = { status: "idle" } | { status: "thanks"; next: string | null };
type FinishRequest =
  | { kind: "end"; userId: string }
  | { kind: "complete"; userId: string; next: string | null };

export function useOnboardingTour({ findPendingUser, finish }: OnboardingTourWithProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userId, setUserId] = useReducer(
    (_current: string | null, next: string | null) => next,
    null,
  );
  const step = useSyncExternalStore(subscribe, () => readStep(userId), readNothing);
  const [thanksHidden, setThanksHidden] = useReducer(
    (_current: boolean, next: boolean) => next,
    false,
  );
  const [completion, finishTour, finishing] = useActionState<OnboardingCompletion, FinishRequest>(
    async (_previous, request) => {
      if (!(await finish(request.userId))) return { status: "idle" };
      if (request.kind === "end") {
        toast("チュートリアルを終了しました。");
        return { status: "idle" };
      }
      setThanksHidden(false);
      return { status: "thanks", next: request.next };
    },
    { status: "idle" },
  );
  const thanks = completion.status === "thanks" && !thanksHidden ? completion : null;

  // 案内を待っているアカウントで、このブラウザにまだその人の進み具合が無ければ、ようこそから始める。
  // 終えた直後に古い判定で始め直さないよう、取り直した判定だけで決める
  useEffect(() => {
    let alive = true;
    void findPendingUser().then((id) => {
      if (!alive) return;
      setUserId(id);
      if (id !== null && readStep(id) === null) saveStep(id, "welcome");
    });
    return () => {
      alive = false;
    };
  }, [step, pathname, findPendingUser]);

  // 画面を移ったことで進む段階（資材ページが開いた・投稿画面が開いた）
  useEffect(() => {
    if (step === null || userId === null) return;
    const after = onboardingStepAfterNavigation(step, pathname);
    if (after !== null) saveStep(userId, after);
  }, [step, pathname, userId]);

  // お礼を短く出してから、その資材の資材ページへ移る。終えた印は「閉じる」で消し終えている
  useEffect(() => {
    if (thanks === null) return;
    const leave = window.setTimeout(() => {
      setThanksHidden(true);
      if (thanks.next !== null) router.push(thanks.next);
    }, THANKS_SHOWN);
    return () => window.clearTimeout(leave);
  }, [thanks, router]);

  const go = useCallback(
    (next: OnboardingStep) => {
      if (userId !== null) saveStep(userId, next);
    },
    [userId],
  );
  const push = useCallback((href: string) => router.push(href), [router]);
  const end = useCallback(() => {
    if (userId === null || finishing) return;
    startTransition(() => finishTour({ kind: "end", userId }));
  }, [userId, finishing, finishTour]);
  // 最後の「閉じる」は、印を消し終えるまでボタンを読み込み中にする。
  // 消せなかったときはエラーを出してシートを残し、もう一度押せるようにする
  const complete = useCallback(() => {
    if (userId === null || finishing) return;
    const next = onboardingFinishHref(pathname);
    startTransition(() => finishTour({ kind: "complete", userId, next }));
  }, [userId, finishing, finishTour, pathname]);

  return { pathname, step, thanks, go, end, complete, finishing, push };
}

const SEARCH_BOX = "search-box";
const INTERACTIVE =
  "a[href], button, input, select, textarea, label, [role=button], [role=combobox], [tabindex]:not([tabindex='-1'])";

/**
 * 入力が目的の場面で、案内の外を押したときの扱い。どこを押しても説明をたたんで次へ進める。
 * リンクやボタンは本来の動きのまま通し、何もないところを押したときだけ入力欄を開く。
 */
function takeBackgroundTap(event: MouseEvent, target: Element | null): boolean {
  if (!(event.target instanceof Element)) return false;
  if (event.target.closest("[data-tour-sheet], [data-tour-tip], [role=status]") !== null)
    return false;
  if (target?.contains(event.target) !== true && event.target.closest(INTERACTIVE) === null) {
    target?.querySelector<HTMLElement>("input:not([type=hidden]), textarea")?.focus();
  }
  return true;
}

/** 説明を読んだら「入力する」か、欄を直接触った時点で説明をたたみ、画面の下の帯に切り替える。 */
export function useCollapsed(target: Element | null, initial = false): [boolean, () => void] {
  const [collapsed, setCollapsed] = useReducer((_current: boolean, next: boolean) => next, initial);
  const collapse = useCallback(() => {
    setCollapsed(true);
    const field = target?.querySelector<HTMLElement>("input:not([type=hidden]), textarea");
    field?.focus();
  }, [target]);
  useEffect(() => {
    if (target === null || collapsed) return;
    const fold = () => setCollapsed(true);
    // この段階の目的は入力なので、吹き出しの外のどこを押しても、説明をたたんで入力欄を開く
    const onClick = (event: MouseEvent) => {
      if (takeBackgroundTap(event, target)) setCollapsed(true);
    };
    target.addEventListener("focusin", fold);
    target.addEventListener("pointerdown", fold);
    document.addEventListener("click", onClick, true);
    return () => {
      target.removeEventListener("focusin", fold);
      target.removeEventListener("pointerdown", fold);
      document.removeEventListener("click", onClick, true);
    };
  }, [target, collapsed, collapse]);
  return [collapsed, collapse];
}

export function useOnboardingSearchIntro(onSearch: boolean, go: (step: OnboardingStep) => void) {
  useEffect(() => {
    if (!onSearch) return;
    const onClick = (event: MouseEvent) => {
      if (takeBackgroundTap(event, document.querySelector(`[data-tour="${SEARCH_BOX}"]`))) {
        go("search");
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [onSearch, go]);
}

export function useOnboardingProfileProgress(
  step: OnboardingStep,
  pathname: string,
  go: (step: OnboardingStep) => void,
  push: (href: string) => void,
) {
  const [saved, setSaved] = useReducer((_current: boolean, next: boolean) => next, false);

  // 案内を読まずに画面の「保存する」を押した場合も含め、プロフィールのフォームを送ったら保存待ちにする
  useEffect(() => {
    const onSubmit = (event: SubmitEvent) => {
      if (event.target instanceof Element && event.target.closest('[data-tour="profile-form"]')) {
        go("profileSaving");
      }
    };
    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, [go]);

  // 保存できるとマイページへ移る。そこで保存したことを伝えてから、検索画面へ移って次の段階の案内を出す。
  // 保存できずにキャンセルなどでマイページへ移ったときは、プロフィールの段階へ戻す
  useEffect(() => {
    if (step !== "profileSaving" || pathname !== "/me") return;
    if (window.location.search !== PROFILE_SAVED_SEARCH) {
      go("profile");
      return;
    }
    const show = window.setTimeout(() => setSaved(true), 0);
    const leave = window.setTimeout(() => {
      go("searchIntro");
      push("/search");
    }, 1900);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(leave);
    };
  }, [step, pathname, go, push]);

  return saved;
}

export function useOnboardingReportSection(
  reports: Element | null,
  go: (step: OnboardingStep) => void,
) {
  useEffect(() => {
    if (reports === null) return;
    const onScroll = () => {
      if (reports.getBoundingClientRect().top < window.innerHeight * SECTION_SEEN)
        go("reviewIntro");
    };
    // スクロール位置が戻されて、目印が出た時点でもう見えていることもある。
    // 読み込み直後（まだスクロールしていない）は上の要素が描き終わっておらず位置が浅く出るので、判定しない
    if (window.scrollY > 0) onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [go, reports]);
}
