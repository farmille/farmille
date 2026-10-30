"use client";

import { useReducer } from "react";

import { useMountEffect } from "@/lib/hooks/use-mount-effect";
import {
  PROFILE_SAVED_SEARCH,
  onboardingShowsOn,
  onboardingStepAfterNavigation,
  onboardingSkipHref,
  skipOnboardingSection,
  isMaterialPage,
  type OnboardingStep,
} from "@/lib/onboarding";
import {
  useOnboardingTour,
  useTourTarget,
  pendingUserId,
  readStep,
  saveStep,
  takeBackgroundTap,
  finishOnboarding,
  type OnboardingTourWithProps,
} from "@/lib/hooks/use-onboarding-tour";

const SECTION_OFFSET = 72;
// 実証詳細レポートの見出しが画面の上から半分より上に来たら、見たものとして次へ進む
const SECTION_SEEN = 0.5;
// 最後のお礼を出しておく時間
const THANKS_SHOWN = 1600;
const SEARCH_BOX = "search-box";
const FINISH_BODY =
  "使用したことのある資材があれば、感想口コミを投稿してください。投稿するときは、画面上部の「投稿する」（スマートフォンでは画面下の「＋」）を押します。";

import { TourBar } from "./TourBar";
import { TourSaved } from "./TourSaved";
import { TourSheet } from "./TourSheet";
import { TourTip } from "./TourTip";

/**
 * 初回ログインの案内（docs/rebuild/onboarding-tour-SPEC.md）。
 * 登録後に案内を終えていない一般会員でログインしているときだけ、実際の画面の上に案内を重ねる。
 */
export function OnboardingTour() {
  return <OnboardingTourWith findPendingUser={pendingUserId} finish={finishOnboarding} />;
}

/** 案内を待つ利用者の判定と、終えた印の消し方を受け取って案内を出す。 */
export function OnboardingTourWith({ findPendingUser, finish }: OnboardingTourWithProps) {
  const tour = useOnboardingTour(finish);
  const { pathname, userId, step, thanks, go, end, complete, finishing, push } = tour;
  return (
    <>
      <TourSync
        key={`${userId}:${step}:${pathname}`}
        userId={userId}
        step={step}
        pathname={pathname}
        findPendingUser={findPendingUser}
        setUserId={tour.setUserId}
      />
      {thanks !== null ? (
        <TourThanks next={thanks.next} leave={tour.leaveThanks} />
      ) : step !== null && onboardingShowsOn(step, pathname) ? (
        <TourStep
          key={`${userId}:${step}`}
          step={step}
          pathname={pathname}
          go={go}
          end={end}
          complete={complete}
          finishing={finishing}
          push={push}
        />
      ) : null}
    </>
  );
}

/**
 * 利用者・段階・画面が変わるたびに作り直し、案内の進み具合をアカウントと画面に合わせる。
 * 画面には何も出さない。
 */
function TourSync({
  userId,
  step,
  pathname,
  findPendingUser,
  setUserId,
}: {
  userId: string | null;
  step: OnboardingStep | null;
  pathname: string;
  findPendingUser: () => Promise<string | null>;
  setUserId: (id: string | null) => void;
}) {
  useMountEffect(() => {
    // 画面を移ったことで進む段階（資材ページが開いた・投稿画面が開いた）
    if (step !== null && userId !== null) {
      const after = onboardingStepAfterNavigation(step, pathname);
      if (after !== null) saveStep(userId, after);
    }
    // 案内を待っているアカウントで、このブラウザにまだその人の進み具合が無ければ、ようこそから始める。
    // 終えた直後に古い判定で始め直さないよう、取り直した判定だけで決める
    let alive = true;
    void findPendingUser().then((id) => {
      if (!alive) return;
      setUserId(id);
      if (id !== null && readStep(id) === null) saveStep(id, "welcome");
    });
    return () => {
      alive = false;
    };
  });
  return null;
}

/** お礼を短く出してから、その資材の資材ページへ移る。 */
function TourThanks({
  next,
  leave,
}: {
  next: string | null;
  leave: (next: string | null) => void;
}) {
  useMountEffect(() => {
    const timer = window.setTimeout(() => leave(next), THANKS_SHOWN);
    return () => window.clearTimeout(timer);
  });
  return <TourSaved title="ありがとうございました" />;
}

type TourStepProps = {
  step: OnboardingStep;
  pathname: string;
  go: (next: OnboardingStep) => void;
  end: () => void;
  complete: () => void;
  /** 最後の「閉じる」を押した後、印を消し終えるまでの間 */
  finishing: boolean;
  push: (href: string) => void;
};

/** 段階ごとの案内。段階か利用者が変わるたびに作り直し、たたんだ状態や go の宛先を持ち越さない。 */
function TourStep({ step, pathname, go, end, complete, finishing, push }: TourStepProps) {
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
          body="栽培作目を登録すると、作目に合った資材や実証詳細レポートを見つけやすくなります。"
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
          body="資材名やメーカー名を入力すると、候補が表示されます（例：鉄力、BIOZ、ICL JAPAN）。候補を選択すると、該当する資材だけが表示されます。"
          message="候補を選択すると、該当する資材だけが表示されます。表示された資材を1つ押して、資材ページを開いてください。"
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
          body={FINISH_BODY}
          primaryLabel="閉じる"
          onPrimary={complete}
          primaryLoading={finishing}
        />
      );
  }
}

type StepControls = { skip: () => void; end: () => void };

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
  return (
    <>
      {onSearch ? <SearchBackgroundTap go={go} /> : null}
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
    </>
  );
}

/** 検索画面で、シートの外のどこかを押したら検索の段階へ進める。 */
function SearchBackgroundTap({ go }: { go: (next: OnboardingStep) => void }) {
  useMountEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (takeBackgroundTap(event, document.querySelector(`[data-tour="${SEARCH_BOX}"]`))) {
        go("search");
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  });
  return null;
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
  // 説明を読んだら「入力する」か、欄を直接触った時点で説明をたたみ、画面の下の帯に切り替える
  const [collapsed, fold] = useReducer(() => true, startCollapsed);
  const collapse = () => {
    fold();
    element?.querySelector<HTMLElement>("input:not([type=hidden]), textarea")?.focus();
  };
  if (collapsed) {
    return (
      <TourBar section={section} message={message} action={action} onSkipStep={skip} onEnd={end} />
    );
  }
  return (
    <>
      {element !== null ? <FoldOnTouch target={element} fold={fold} /> : null}
      <TourTip
        target={element}
        title={title}
        body={body}
        section={section}
        primary={{ label: "入力する", onClick: collapse }}
        onSkipStep={skip}
        onEnd={end}
      />
    </>
  );
}

/** 説明を出している間、欄を触るか吹き出しの外を押したら説明をたたむ。 */
function FoldOnTouch({ target, fold }: { target: Element; fold: () => void }) {
  useMountEffect(() => {
    // この段階の目的は入力なので、吹き出しの外のどこを押しても、説明をたたんで入力欄を開く
    const onClick = (event: MouseEvent) => {
      if (takeBackgroundTap(event, target)) fold();
    };
    target.addEventListener("focusin", fold);
    target.addEventListener("pointerdown", fold);
    document.addEventListener("click", onClick, true);
    return () => {
      target.removeEventListener("focusin", fold);
      target.removeEventListener("pointerdown", fold);
      document.removeEventListener("click", onClick, true);
    };
  });
  return null;
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
  // 案内を読まずに画面の「保存する」を押した場合も含め、プロフィールのフォームを送ったら保存待ちにする
  useMountEffect(() => {
    const onSubmit = (event: SubmitEvent) => {
      if (event.target instanceof Element && event.target.closest('[data-tour="profile-form"]')) {
        go("profileSaving");
      }
    };
    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  });
  if (pathname === "/me") {
    return step === "profileSaving" ? <ProfileSaved go={go} push={push} /> : null;
  }
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

/**
 * 保存できるとマイページへ移る。そこで保存したことを伝えてから、検索画面へ移って次の段階の案内を出す。
 * 保存できずにキャンセルなどでマイページへ移ったときは、プロフィールの段階へ戻す
 */
function ProfileSaved({
  go,
  push,
}: {
  go: (next: OnboardingStep) => void;
  push: (href: string) => void;
}) {
  const [saved, show] = useReducer(() => true, false);
  useMountEffect(() => {
    if (window.location.search !== PROFILE_SAVED_SEARCH) {
      go("profile");
      return;
    }
    const showing = window.setTimeout(show, 0);
    const leave = window.setTimeout(() => {
      go("searchIntro");
      push("/search");
    }, 1900);
    return () => {
      window.clearTimeout(showing);
      window.clearTimeout(leave);
    };
  });
  return saved ? <TourSaved title="プロフィールを保存しました" /> : null;
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
  return (
    <>
      {reports !== null ? <ReportSectionSeen reports={reports} go={go} /> : null}
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
    </>
  );
}

/** 実証詳細レポートの見出しが画面の上半分に来たら、感想口コミの段階へ進める。 */
function ReportSectionSeen({
  reports,
  go,
}: {
  reports: Element;
  go: (next: OnboardingStep) => void;
}) {
  useMountEffect(() => {
    const onScroll = () => {
      if (reports.getBoundingClientRect().top < window.innerHeight * SECTION_SEEN)
        go("reviewIntro");
    };
    // スクロール位置が戻されて、目印が出た時点でもう見えていることもある。
    // 読み込み直後（まだスクロールしていない）は上の要素が描き終わっておらず位置が浅く出るので、判定しない
    if (window.scrollY > 0) onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  });
  return null;
}
