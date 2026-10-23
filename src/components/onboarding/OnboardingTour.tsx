"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { createAuthBrowserClient } from "@/lib/auth/browser";
import {
  PROFILE_SAVED_SEARCH,
  clearOnboarding,
  isMaterialPage,
  isOnboardingPending,
  onboardingShowsOn,
  onboardingSkipHref,
  onboardingStepAfterNavigation,
  readOnboardingStep,
  skipOnboardingSection,
  writeOnboardingStep,
  type OnboardingStep,
} from "@/lib/onboarding";
import { finishOnboardingAction } from "@/server/actions/onboarding";
import { errorMessageJa } from "@/server/errors";

import { toast } from "../Toaster";
import { TourBar } from "./TourBar";
import { TourSaved } from "./TourSaved";
import { TourSheet } from "./TourSheet";
import { TourTip } from "./TourTip";

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
async function pendingUserId(): Promise<string | null> {
  const auth = createAuthBrowserClient().auth;
  const { data } = await auth.getSession();
  if (!isOnboardingPending(data.session?.user ?? null)) return null;
  const { user } = (await auth.getUser()).data;
  return user !== null && isOnboardingPending(user) ? user.id : null;
}

/** data-tour の目印が画面に出るまで待つ（画面の移動直後や読み込み中は、まだない）。 */
function useTourTarget(name: string | null): Element | null {
  const [found, setFound] = useState<{ name: string; element: Element } | null>(null);
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
const SECTION_OFFSET = 72;
const FINISH_FAILED = "チュートリアルを終了できませんでした。時間を置いて再度お試しください。";
// 最後のお礼を出しておく時間
const THANKS_SHOWN = 1600;

/**
 * 案内を終えた印をアカウントに残し、セッションを取り直してから、このブラウザの進み具合を消す。
 * 取り直す前に消すと、古いセッションの印を見て案内を最初から出し直してしまう。
 */
async function finishOnboarding(userId: string): Promise<boolean> {
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

/**
 * 初回ログインの案内（docs/rebuild/onboarding-tour-SPEC.md）。
 * 登録後に案内を終えていない一般会員でログインしているときだけ、実際の画面の上に案内を重ねる。
 */
export function OnboardingTour() {
  const pathname = usePathname();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const step = useSyncExternalStore(subscribe, () => readStep(userId), readNothing);
  const [thanks, setThanks] = useState(false);

  // 案内を待っているアカウントで、このブラウザにまだその人の進み具合が無ければ、ようこそから始める。
  // 終えた直後に古い判定で始め直さないよう、取り直した判定だけで決める
  useEffect(() => {
    let alive = true;
    void pendingUserId().then((id) => {
      if (!alive) return;
      setUserId(id);
      if (id !== null && readStep(id) === null) saveStep(id, "welcome");
    });
    return () => {
      alive = false;
    };
  }, [step, pathname]);

  // 画面を移ったことで進む段階（資材ページが開いた・投稿画面が開いた）
  useEffect(() => {
    if (step === null || userId === null) return;
    const after = onboardingStepAfterNavigation(step, pathname);
    if (after !== null) saveStep(userId, after);
  }, [step, pathname, userId]);

  // お礼を短く出してからホームへ戻る。終えた印は「閉じる」の時点で残してある
  useEffect(() => {
    if (!thanks) return;
    const leave = window.setTimeout(() => {
      setThanks(false);
      router.push("/");
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
  const end = useCallback(async () => {
    if (userId !== null && (await finishOnboarding(userId)))
      toast("チュートリアルを終了しました。");
  }, [userId]);
  const complete = useCallback(async () => {
    if (userId !== null && (await finishOnboarding(userId))) setThanks(true);
  }, [userId]);

  if (thanks) return <TourSaved title="ありがとうございました" />;
  if (step === null || !onboardingShowsOn(step, pathname)) return null;
  return (
    <TourStep
      key={step}
      step={step}
      pathname={pathname}
      go={go}
      end={end}
      complete={complete}
      push={push}
    />
  );
}

type TourStepProps = {
  step: OnboardingStep;
  pathname: string;
  go: (next: OnboardingStep) => void;
  end: () => void;
  complete: () => void;
  push: (href: string) => void;
};

/** 段階ごとの案内。段階が変わるたびに作り直し、たたんだ状態などを持ち越さない。 */
function TourStep({ step, pathname, go, end, complete, push }: TourStepProps) {
  // 次の段階の案内が出る画面へ移り、スキップした画面に取り残さない
  const skip = () => {
    const next = skipOnboardingSection(step);
    go(next);
    const href = onboardingSkipHref(next, pathname);
    if (href !== null) push(href);
  };
  switch (step) {
    case "welcome":
      return (
        <TourSheet
          title="Farmilleへようこそ"
          welcome
          body="はじめての方向けに、Farmilleの基本的な使い方を3つの手順でご案内します。"
          primaryLabel="はじめる"
          onPrimary={() => go("profileIntro")}
          onEnd={end}
        />
      );
    case "profileIntro":
      return (
        <TourSheet
          title="プロフィールの設定"
          body="栽培作目を登録すると、作目に合った資材やレポートを見つけやすくなります。"
          section={{ current: 1, total: 3 }}
          primaryLabel="プロフィール画面へ"
          onPrimary={() => {
            go("profile");
            push("/me/edit");
          }}
          onSkipStep={skip}
          onEnd={end}
        />
      );
    case "profile":
    case "profileSaving":
      return (
        <ProfileStep step={step} pathname={pathname} go={go} push={push} skip={skip} end={end} />
      );
    case "searchIntro":
      return <SearchIntroStep pathname={pathname} go={go} push={push} skip={skip} end={end} />;
    case "search":
      return (
        <InputStep
          target={SEARCH_BOX}
          title="資材名・メーカー名を入力"
          body="候補から選ぶと、検索結果が絞り込まれます（例：鉄力、BIOZ、ICL JAPAN）。"
          message="候補から検索条件を選び、検索結果から資材を選んでください（条件は追加できます）。"
          section={2}
          startCollapsed={hasFocusIn(SEARCH_BOX)}
          skip={skip}
          end={end}
        />
      );
    case "materialScroll":
      return <ScrollStep go={go} skip={skip} end={end} />;
    case "reviewIntro":
      return (
        <TourSheet
          title="感想口コミの投稿"
          body="使用した資材の感想を、ほかの生産者と共有できます。"
          section={{ current: 3, total: 3 }}
          primaryLabel="次へ"
          // 投稿の入口では「感想口コミを書く」を示す資材ページが無いので、そのまま終わりのシートへ
          onPrimary={() => go(isMaterialPage(pathname) ? "reviewLink" : "finish")}
          onSkipStep={skip}
          onEnd={end}
        />
      );
    case "reviewLink":
      return (
        <TargetTip
          target="review-link"
          title="感想口コミを書く"
          section={3}
          pulse
          body="画面の下の「感想口コミを書く」を押すと、投稿画面が開きます。圃場の条件や数値も記録する場合は、「実証詳細レポートを書く」を使ってください。"
          skip={skip}
          end={end}
        />
      );
    case "finish":
      return (
        <TourSheet
          title="チュートリアルはこれで完了です"
          body="使用したことのある資材があれば、感想口コミを記入してみてください。プロフィールの変更はマイページから、感想口コミの投稿は画面下の「＋」から、いつでもできます。"
          primaryLabel="閉じる"
          onPrimary={complete}
        />
      );
  }
}

type StepControls = { skip: () => void; end: () => void };

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

/** 目印の要素の中に、いま入力中の欄があるか。 */
function hasFocusIn(name: string): boolean {
  return document.activeElement?.closest(`[data-tour="${name}"]`) != null;
}

/**
 * 検索の段階の始まり。検索画面では、シートの外のどこを押しても次へ進み、そのまま検索欄に入力できるようにする。
 */
function SearchIntroStep({
  pathname,
  go,
  push,
  skip,
  end,
}: StepControls & Pick<TourStepProps, "pathname" | "go" | "push">) {
  const onSearch = pathname === "/search";
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
  return (
    <TourSheet
      title="資材の検索"
      body="資材名やメーカー名、作物、悩みなどのキーワードで資材を探せます。"
      section={{ current: 2, total: 3 }}
      primaryLabel={onSearch ? "次へ" : "検索画面へ"}
      onPrimary={() => {
        go("search");
        if (!onSearch) push("/search");
      }}
      onSkipStep={skip}
      onEnd={end}
    />
  );
}

function TargetTip({
  target,
  title,
  body,
  section,
  primary,
  pulse,
  skip,
  end,
}: StepControls & {
  target: string;
  title: string;
  body: string;
  section?: number;
  primary?: { label: string; onClick: () => void };
  pulse?: boolean;
}) {
  const element = useTourTarget(target);
  return (
    <TourTip
      target={element}
      title={title}
      body={body}
      section={section}
      primary={primary}
      pulse={pulse}
      onSkipStep={skip}
      onEnd={end}
    />
  );
}

/** 説明を読んだら「入力する」か、欄を直接触った時点で説明をたたみ、画面の下の帯に切り替える。 */
function useCollapsed(target: Element | null, initial = false): [boolean, () => void] {
  const [collapsed, setCollapsed] = useState(initial);
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

function InputStep({
  target,
  title,
  body,
  message,
  action,
  startCollapsed = false,
  section,
  skip,
  end,
}: StepControls & {
  target: string;
  title: string;
  body: string;
  message: string;
  action?: { label: string; onClick: () => void };
  /** 保存を押した後など、説明を読み終えている場面では最初から帯で出す */
  startCollapsed?: boolean;
  section: number;
}) {
  const element = useTourTarget(target);
  const [collapsed, collapse] = useCollapsed(element, startCollapsed);
  if (collapsed) {
    return (
      <TourBar section={section} message={message} action={action} onSkipStep={skip} onEnd={end} />
    );
  }
  return (
    <TourTip
      target={element}
      title={title}
      body={body}
      section={section}
      primary={{ label: "入力する", onClick: collapse }}
      onSkipStep={skip}
      onEnd={end}
    />
  );
}

/** プロフィール：栽培作目を示し、帯か画面の「保存する」で保存できたら、保存したことを伝えて次の段階へ。 */
function ProfileStep({
  step,
  pathname,
  go,
  push,
  skip,
  end,
}: StepControls & {
  step: OnboardingStep;
  pathname: string;
  go: (next: OnboardingStep) => void;
  push: (href: string) => void;
}) {
  const [saved, setSaved] = useState(false);

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

  if (pathname === "/me") return saved ? <TourSaved title="プロフィールを保存しました" /> : null;
  return (
    <InputStep
      target="profile-crops"
      title="栽培作目を選択"
      body="栽培している作目を候補から選び（複数選択可）、「保存する」を押してください。"
      message="栽培作目を選んで「保存する」を押してください（複数選択可）。所属や自己紹介も入力できます。"
      startCollapsed={step === "profileSaving"}
      section={1}
      action={{
        label: "保存する",
        onClick: () => {
          const form = document.querySelector<HTMLFormElement>('[data-tour="profile-form"]');
          form?.requestSubmit();
        },
      }}
      skip={skip}
      end={end}
    />
  );
}

/** 実証詳細レポートの見出しを、画面の上のほう（固定の見出しの下）まで送る。 */
function scrollToSection(section: Element) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const top = section.getBoundingClientRect().top + window.scrollY - SECTION_OFFSET;
  window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
}

/** 資材ページ：実証詳細レポートの見出しが見えるところまで下へスクロールしたら、感想口コミの段階へ。 */
function ScrollStep({ go, skip, end }: StepControls & { go: (next: OnboardingStep) => void }) {
  const reports = useTourTarget("material-reports");
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
  return (
    <TourBar
      section={2}
      title="画面の下に、実証詳細レポートと感想口コミがあります。"
      message="下へスクロールして、製品情報と合わせて確認してください。"
      scrollHint={
        reports === null
          ? undefined
          : { label: "下へスクロール", onClick: () => scrollToSection(reports) }
      }
      onSkipStep={skip}
      onEnd={end}
    />
  );
}
