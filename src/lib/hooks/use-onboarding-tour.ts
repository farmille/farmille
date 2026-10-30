"use client";
import { usePathname, useRouter } from "next/navigation";
import {
  startTransition,
  useActionState,
  useCallback,
  useReducer,
  useSyncExternalStore,
} from "react";
import { createAuthBrowserClient } from "@/lib/auth/browser";
import {
  clearOnboarding,
  isOnboardingPending,
  onboardingFinishHref,
  readOnboardingStep,
  writeOnboardingStep,
  type OnboardingStep,
} from "@/lib/onboarding";
import { finishOnboardingAction } from "@/server/actions/onboarding";
import { errorMessageJa } from "@/server/errors";
import { toast } from "@/components/Toaster";
import { useMountEffect } from "./use-mount-effect";

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
export function readStep(userId: string | null): OnboardingStep | null {
  if (userId === null) return null;
  try {
    return readOnboardingStep(window.localStorage, userId);
  } catch {
    return null;
  }
}
const readNothing = () => null;
export function saveStep(userId: string, step: OnboardingStep | null) {
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
export function useTourTarget(name: string): Element | null {
  const [found, setFound] = useReducer(
    (_current: Element | null, next: Element | null) => next,
    null,
  );
  useMountEffect(() => {
    const look = () => {
      const element = document.querySelector(`[data-tour="${name}"]`);
      if (element !== null) setFound(element);
      return element !== null;
    };
    if (look()) return;
    const timer = window.setInterval(() => {
      if (look()) window.clearInterval(timer);
    }, 200);
    return () => window.clearInterval(timer);
  });
  return found?.isConnected === true ? found : null;
}

const FINISH_FAILED = "チュートリアルを終了できませんでした。時間を置いて再度お試しください。";

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

export function useOnboardingTour(finish: OnboardingTourWithProps["finish"]) {
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

  // お礼を出し終えたら、その資材の資材ページへ移る。終えた印は「閉じる」で消し終えている
  const leaveThanks = useCallback(
    (next: string | null) => {
      setThanksHidden(true);
      if (next !== null) router.push(next);
    },
    [router],
  );

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

  return {
    pathname,
    userId,
    setUserId,
    step,
    thanks,
    leaveThanks,
    go,
    end,
    complete,
    finishing,
    push,
  };
}

const INTERACTIVE =
  "a[href], button, input, select, textarea, label, [role=button], [role=combobox], [tabindex]:not([tabindex='-1'])";

/**
 * 入力が目的の場面で、案内の外を押したときの扱い。どこを押しても説明をたたんで次へ進める。
 * リンクやボタンは本来の動きのまま通し、何もないところを押したときだけ入力欄を開く。
 */
export function takeBackgroundTap(event: MouseEvent, target: Element | null): boolean {
  if (!(event.target instanceof Element)) return false;
  if (event.target.closest("[data-tour-sheet], [data-tour-tip], [role=status]") !== null)
    return false;
  if (target?.contains(event.target) !== true && event.target.closest(INTERACTIVE) === null) {
    target?.querySelector<HTMLElement>("input:not([type=hidden]), textarea")?.focus();
  }
  return true;
}
