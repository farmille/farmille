"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

import { Button } from "@/components/Button";

import { css, cx } from "../../../styled-system/css";
import { TourEndButton } from "./TourEndButton";
import { TourLabel } from "./TourLabel";
import { riseStyle, sentenceStyle, sentences, useEntered } from "./tour-motion";

// 光らせる枠。周りを暗くする幕は枠の影で描き、画面の操作はさえぎらない（pointer-events: none）
const spotStyle = css({
  position: "fixed",
  zIndex: "guide",
  top: "var(--tour-spot-top)",
  left: "var(--tour-spot-left)",
  w: "var(--tour-spot-width)",
  h: "var(--tour-spot-height)",
  borderRadius: "card",
  pointerEvents: "none",
  boxShadow: "shadow.spotlight",
  transitionProperty: "opacity",
  transitionDuration: "dialog",
  transitionTimingFunction: "out",
  opacity: "0",
  "&[data-entered]": { opacity: "1" },
  // 押してほしいボタンのときは、枠の外へ広がる輪を重ねて目立たせる
  "&[data-pulse]::after": {
    content: '""',
    position: "absolute",
    inset: "0",
    borderRadius: "inherit",
    borderWidth: "3px",
    borderStyle: "solid",
    borderColor: "surface.card",
    animation: "tourRing",
    _motionReduce: { animation: "none", opacity: "0" },
  },
});

const cardStyle = css({
  position: "fixed",
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

const headStyle = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  // 狭い画面では「チュートリアルを終了」を次の行へ送り、はみ出さないようにする
  flexWrap: "wrap",
  gap: "2",
  minH: "10",
  // 見出し行だけ左右の余白を詰め、ラベルと終了ボタンを1行に収める
  mx: "-2",
  "& > :last-child": { ml: "auto" },
});
const titleStyle = css({ textStyle: "body", fontWeight: "bold" });
const bodyStyle = css({ textStyle: "supporting", color: "text.muted" });
const rowStyle = css({ display: "flex", justifyContent: "flex-end", gap: "2", mt: "1" });

// 実行時に決まる位置は CSS 変数で渡し、スタイル側は var() で受ける
type TourVars = CSSProperties & { [key: `--tour-${string}`]: string };

type Box = { top: number; left: number; width: number; height: number; cardTop: number };

const PAD = 8;
const GAP = 12;

/** 画面に固定された要素（下部の固定バーなど）か。固定されていなければスクロールで見える位置に出す。 */
function isFixed(element: Element): boolean {
  for (let node: Element | null = element; node !== null; node = node.parentElement) {
    if (getComputedStyle(node).position === "fixed") return true;
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

/** 光らせる対象の位置を測り、スクロールや画面の大きさが変わるたびに追いかける。 */
function useSpot(target: Element | null, card: RefObject<HTMLElement | null>): Box | null {
  const [box, setBox] = useState<Box | null>(null);
  useLayoutEffect(() => {
    if (target === null) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const r = target.getBoundingClientRect();
      const viewport = window.innerHeight;
      const top = Math.max(6, r.top - PAD);
      const bottom = Math.min(viewport - 6, r.bottom + PAD);
      const cardHeight = card.current?.offsetHeight ?? 160;
      const below = bottom + GAP;
      const cardTop =
        below + cardHeight < viewport - GAP ? below : Math.max(GAP, top - GAP - cardHeight);
      setBox({
        top,
        left: Math.max(6, r.left - PAD),
        width: r.width + PAD * 2,
        height: bottom - top,
        cardTop,
      });
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(target);
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
  const entered = useEntered();
  if (target === null) return null;
  const state = entered && box !== null ? "" : undefined;
  const vars: TourVars = {
    "--tour-spot-top": `${box?.top ?? 0}px`,
    "--tour-spot-left": `${box?.left ?? 0}px`,
    "--tour-spot-width": `${box?.width ?? 0}px`,
    "--tour-spot-height": `${box?.height ?? 0}px`,
    "--tour-card-top": `${box?.cardTop ?? 0}px`,
  };
  return (
    <>
      <div
        className={spotStyle}
        style={vars}
        data-entered={state}
        data-pulse={pulse ? "" : undefined}
        aria-hidden="true"
      />
      <section
        ref={card}
        data-tour-tip=""
        className={cx(cardStyle, riseStyle)}
        style={vars}
        data-entered={state}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-tip-title"
      >
        <div className={headStyle}>
          {section ? <TourLabel section={section} /> : <span />}
          <TourEndButton onEnd={onEnd} />
        </div>
        <h3 id="tour-tip-title" className={titleStyle}>
          {title}
        </h3>
        <p className={bodyStyle}>
          {sentences(body).map((line) => (
            <span key={line} className={sentenceStyle}>
              {line}
            </span>
          ))}
        </p>
        <div className={rowStyle}>
          <Button variant="ghost" size="sm" onClick={onSkipStep}>
            この手順をスキップ
          </Button>
          {primary ? (
            <Button size="sm" onClick={primary.onClick}>
              {primary.label}
            </Button>
          ) : null}
        </div>
      </section>
    </>
  );
}
