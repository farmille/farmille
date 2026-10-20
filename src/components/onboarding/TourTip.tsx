"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

import { css, cva, cx } from "../../../styled-system/css";
import { TourCardBody } from "./TourCardBody";
import { riseStyle, useCardHandoff, useEntered, useHandoff } from "./tour-motion";

// 画面に固定・貼り付く対象には画面へ、ページの中の対象にはページへ留め、ページの中の対象はスクロールで遅れずに一緒に動くようにする
const anchorRecipe = cva({
  variants: {
    anchor: { viewport: { position: "fixed" }, page: { position: "absolute" } },
  },
});

// 光らせる枠。周りを暗くする幕は枠の影で描き、画面の操作はさえぎらない（pointer-events: none）
const spotStyle = css({
  zIndex: "guide",
  top: "var(--tour-spot-top)",
  left: "var(--tour-spot-left)",
  w: "var(--tour-spot-width)",
  h: "var(--tour-spot-height)",
  borderRadius: "card",
  pointerEvents: "none",
  boxShadow: "shadow.spotlight",
  transitionProperty: "[opacity]",
  transitionDuration: "dialog",
  transitionTimingFunction: "out",
  opacity: "0",
  "&[data-entered]": { opacity: "1" },
  // 押してほしいボタンのときは、枠の外へ広がる輪を重ねて目立たせる
  "&[data-pulse]::after": {
    content: '""',
    position: "absolute",
    inset: "0",
    borderRadius: "[inherit]",
    borderWidth: "3px",
    borderStyle: "solid",
    borderColor: "surface.card",
    animation: "tourRing",
    _motionReduce: { animation: "none", opacity: "0" },
  },
});

const cardStyle = css({
  zIndex: "guide",
  left: "3",
  right: "3",
  top: "var(--tour-card-top)",
  mx: "auto",
  maxW: "guide",
  display: "flex",
  flexDirection: "column",
  gap: "2",
  px: "4.5",
  pt: "3",
  pb: "3.5",
  bg: "surface.card",
  color: "text.default",
  borderRadius: "card",
  boxShadow: "shadow.lift",
});

type Anchor = "viewport" | "page";

type Box = {
  anchor: Anchor;
  top: number;
  left: number;
  width: number;
  height: number;
  cardTop: number;
};

const PAD = 8;
const GAP = 12;

/**
 * 画面に固定された要素（下部の固定バー）か、スクロールで画面に貼り付く要素（検索欄）か。
 * どちらでもなければ、ページと一緒にスクロールする。
 */
function isFixed(element: Element): boolean {
  for (let node: Element | null = element; node !== null; node = node.parentElement) {
    const position = getComputedStyle(node).position;
    if (position === "fixed" || position === "sticky") return true;
  }
  return false;
}

/**
 * 対象が画面の外にあるときは、画面の上寄りに来るまでスクロールする。
 * 画面の移動直後はページ側がスクロール位置を戻すことがあるので、少し後にもう一度確かめる。
 */
function useBringIntoView(target: Element | null) {
  useEffect(() => {
    if (target === null || isFixed(target)) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bring = () => {
      const r = target.getBoundingClientRect();
      if (r.top >= 0 && r.bottom <= window.innerHeight * 0.6) return;
      window.scrollBy({
        top: r.top - window.innerHeight * 0.22,
        behavior: reduce ? "auto" : "smooth",
      });
    };
    const timers = [0, 400, 1000].map((delay) => window.setTimeout(bring, delay));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [target]);
}

/**
 * 光らせる対象の位置を測る。画面に固定・貼り付く対象は画面の座標で測り、スクロールのたびに測り直す。
 * ページの中の対象はページの座標で測り、スクロールにはブラウザがそのまま追従させる（測り直すのは大きさが変わったときだけ）。
 */
function useSpot(target: Element | null, card: RefObject<HTMLElement | null>): Box | null {
  const [box, setBox] = useState<Box | null>(null);
  useLayoutEffect(() => {
    if (target === null) return;
    const anchor: Anchor = isFixed(target) ? "viewport" : "page";
    let frame = 0;
    const measure = () => {
      frame = 0;
      const r = target.getBoundingClientRect();
      const cardHeight = card.current?.offsetHeight ?? 160;
      if (anchor === "viewport") {
        const viewport = window.innerHeight;
        const top = Math.max(6, r.top - PAD);
        const bottom = Math.min(viewport - 6, r.bottom + PAD);
        const below = bottom + GAP;
        const cardTop =
          below + cardHeight < viewport - GAP ? below : Math.max(GAP, top - GAP - cardHeight);
        setBox({
          anchor,
          top,
          left: Math.max(6, r.left - PAD),
          width: r.width + PAD * 2,
          height: bottom - top,
          cardTop,
        });
        return;
      }
      const top = r.top + window.scrollY - PAD;
      const bottom = r.bottom + window.scrollY + PAD;
      // ページに置いた枠は横スクロールを生むので、左右は画面の幅に収める
      const left = Math.max(6, r.left - PAD);
      const right = Math.min(document.documentElement.clientWidth - 6, r.right + PAD);
      const below = bottom + GAP;
      const page = document.documentElement.scrollHeight;
      const cardTop =
        below + cardHeight < page - GAP ? below : Math.max(GAP, top - GAP - cardHeight);
      setBox({
        anchor,
        top,
        left: left + window.scrollX,
        width: right - left,
        height: bottom - top,
        cardTop,
      });
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };
    measure();
    if (anchor === "viewport") {
      window.addEventListener("scroll", schedule, { capture: true, passive: true });
    }
    window.addEventListener("resize", schedule);
    // ページの中の対象は、上の要素が読み込まれて位置がずれたときにも測り直す
    const observer = new ResizeObserver(schedule);
    observer.observe(target);
    observer.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, [target, card]);
  return box;
}

export type TourTipProps = {
  /** 光らせる要素。見つかるまでは何も出さない */
  target: Element | null;
  title: string;
  body: string;
  /** 3段階のどこにいるか。左上に「チュートリアル中　1 / 3」と出す */
  section?: number;
  /** 吹き出しの主ボタン。画面の本物の操作で進む手順では省く */
  primary?: { label: string; onClick: () => void };
  /** 光らせた要素が押してほしいボタンのとき、周りに広がる輪を出す */
  pulse?: boolean;
  onSkipStep: () => void;
  onEnd: () => void;
};

/** 画面の一部を光らせ、その上か下に説明の吹き出しを出す。 */
export function TourTip({
  target,
  title,
  body,
  section,
  primary,
  pulse = false,
  onSkipStep,
  onEnd,
}: TourTipProps) {
  const card = useRef<HTMLElement>(null);
  useBringIntoView(target);
  const box = useSpot(target, card);
  const handoff = useHandoff();
  const entered = useEntered(handoff.continuing);
  const lit = useEntered(handoff.dimmed);
  useCardHandoff(card, box !== null, true);
  if (target === null) return null;
  const state = entered && box !== null ? "" : undefined;
  const spotState = lit && box !== null ? "" : undefined;
  const anchor = anchorRecipe({ anchor: box?.anchor ?? "viewport" });
  // 実行時に決まる位置は CSS 変数で渡し、スタイル側は var() で受ける
  return (
    <>
      <div
        className={cx(anchor, spotStyle)}
        style={{
          "--tour-spot-top": `${box?.top ?? 0}px`,
          "--tour-spot-left": `${box?.left ?? 0}px`,
          "--tour-spot-width": `${box?.width ?? 0}px`,
          "--tour-spot-height": `${box?.height ?? 0}px`,
        }}
        data-entered={spotState}
        data-pulse={pulse ? "" : undefined}
        aria-hidden="true"
      />
      <section
        ref={card}
        data-tour-tip=""
        className={cx(anchor, cardStyle, riseStyle)}
        style={{ "--tour-card-top": `${box?.cardTop ?? 0}px` }}
        data-entered={state}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-tip-title"
      >
        <TourCardBody
          section={section}
          title={title}
          titleId="tour-tip-title"
          body={body}
          primary={primary}
          onSkipStep={onSkipStep}
          onEnd={onEnd}
        />
      </section>
    </>
  );
}
