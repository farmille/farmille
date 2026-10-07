"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { css, cva, cx } from "../../../styled-system/css";

/** 1セット分を流し切る周期。 */
const LOOP_MS = 55_000;
/** カーソルを乗せている間の再生速度。 */
const HOVER_RATE = 0.25;
/** これを超えて動いたらタップではなく横ドラッグとして扱う。 */
const DRAG_THRESHOLD_PX = 4;

type MarqueeMode = "marquee" | "static";

const frameRecipe = cva({
  base: {
    mx: "-4",
    pt: "1",
    pb: "2",
    overflow: "hidden",
    maskImage:
      "linear-gradient(90deg, transparent, token(colors.scrim) 6%, token(colors.scrim) 94%, transparent)",
    _motionReduce: { overflowX: "auto" },
    tab: { mx: "0" },
  },
  variants: {
    mode: {
      marquee: { cursor: "grab", touchAction: "pan-y", userSelect: "none" },
      static: { overflowX: "auto" },
    },
  },
});

const setStyle = css({ display: "flex", gap: "3", pr: "3" });

/** 周期内に収まるよう再生位置を正規化する。 */
function wrapTime(time: number): number {
  return ((time % LOOP_MS) + LOOP_MS) % LOOP_MS;
}

/**
 * 掲載資材の横並びを左へ流し続ける。
 * カーソルを乗せると減速し、ホイール・ドラッグ・キーボードフォーカスで位置を動かせる。
 * 視覚過敏の設定・アニメーション非対応・カードが画面内に収まる場合は手動スクロールに落とす。
 */
export function HomeMaterialMarquee({ children }: { children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<MarqueeMode>("marquee");

  useEffect(() => {
    if (mode !== "marquee") return;
    const frameElement = frameRef.current;
    const trackElement = trackRef.current;
    const setElement = setRef.current;
    if (!frameElement || !trackElement || !setElement) return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("animate" in trackElement) ||
      setElement.getBoundingClientRect().width <= frameElement.clientWidth
    ) {
      setMode("static");
      return;
    }

    const animation = trackElement.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-50%)" }],
      { duration: LOOP_MS, iterations: Number.POSITIVE_INFINITY, easing: "linear" },
    );

    // 位置は transform を直接書き換えず再生位置で動かす。リサイズにも追従させるため都度計測する。
    const shift = (px: number) => {
      const stride = setElement.getBoundingClientRect().width;
      if (stride === 0) return;
      animation.currentTime = wrapTime(
        Number(animation.currentTime ?? 0) + (px / stride) * LOOP_MS,
      );
    };

    let dragOrigin: number | null = null;
    let dragging = false;
    let suppressClick = false;

    const handlePointerEnter = (event: PointerEvent) => {
      // タッチのタップで減速したまま戻らなくなるのを避ける。
      if (event.pointerType !== "mouse") return;
      animation.updatePlaybackRate(HOVER_RATE);
    };
    const handlePointerLeave = () => {
      animation.updatePlaybackRate(1);
    };

    const handleWheel = (event: WheelEvent) => {
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.shiftKey
            ? event.deltaY
            : 0;
      if (delta === 0) return;
      event.preventDefault();
      shift(delta);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      dragOrigin = event.clientX;
      dragging = false;
      suppressClick = false;
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (dragOrigin === null) return;
      const dx = event.clientX - dragOrigin;
      if (!dragging) {
        if (Math.abs(dx) <= DRAG_THRESHOLD_PX) return;
        dragging = true;
        suppressClick = true;
        if (frameElement.hasPointerCapture(event.pointerId) === false) {
          frameElement.setPointerCapture(event.pointerId);
        }
      }
      dragOrigin = event.clientX;
      shift(-dx);
    };
    const handlePointerUp = () => {
      dragOrigin = null;
      dragging = false;
    };
    // ドラッグ直後の click はカードを開かない。
    const handleClickCapture = (event: MouseEvent) => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    };
    // リンクと画像のネイティブドラッグを止める。放置すると pointercancel で横ドラッグが途切れる。
    const handleDragStart = (event: DragEvent) => {
      event.preventDefault();
    };

    // 自動で流れる内容にキーボードでも到達できるよう、フォーカスしたカードを画面内へ寄せて止める。
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.matches(":focus-visible")) return;
      animation.pause();
      const stride = setElement.getBoundingClientRect().width;
      if (stride === 0) return;
      const cardLeft =
        target.getBoundingClientRect().left - setElement.getBoundingClientRect().left;
      animation.currentTime = wrapTime((cardLeft / stride) * LOOP_MS);
    };
    const handleFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (next instanceof Node && frameElement.contains(next)) return;
      animation.play();
    };

    frameElement.addEventListener("pointerenter", handlePointerEnter);
    frameElement.addEventListener("pointerleave", handlePointerLeave);
    frameElement.addEventListener("wheel", handleWheel, { passive: false });
    frameElement.addEventListener("pointerdown", handlePointerDown);
    frameElement.addEventListener("pointermove", handlePointerMove);
    frameElement.addEventListener("pointerup", handlePointerUp);
    frameElement.addEventListener("pointercancel", handlePointerUp);
    frameElement.addEventListener("click", handleClickCapture, { capture: true });
    frameElement.addEventListener("dragstart", handleDragStart);
    frameElement.addEventListener("focusin", handleFocusIn);
    frameElement.addEventListener("focusout", handleFocusOut);

    return () => {
      frameElement.removeEventListener("pointerenter", handlePointerEnter);
      frameElement.removeEventListener("pointerleave", handlePointerLeave);
      frameElement.removeEventListener("wheel", handleWheel);
      frameElement.removeEventListener("pointerdown", handlePointerDown);
      frameElement.removeEventListener("pointermove", handlePointerMove);
      frameElement.removeEventListener("pointerup", handlePointerUp);
      frameElement.removeEventListener("pointercancel", handlePointerUp);
      frameElement.removeEventListener("click", handleClickCapture, { capture: true });
      frameElement.removeEventListener("dragstart", handleDragStart);
      frameElement.removeEventListener("focusin", handleFocusIn);
      frameElement.removeEventListener("focusout", handleFocusOut);
      animation.cancel();
    };
  }, [mode]);

  return (
    <div
      ref={frameRef}
      data-ui="home-material-marquee"
      data-mode={mode}
      className={frameRecipe({ mode })}
    >
      <div
        ref={trackRef}
        className={css({ display: "flex", w: "max-content", willChange: "transform" })}
      >
        <div ref={setRef} className={setStyle}>
          {children}
        </div>
        {mode === "marquee" ? (
          // ループ用の複製。支援技術とキーボードフォーカスから除外する。
          <div
            className={cx(setStyle, css({ _motionReduce: { display: "none" } }))}
            aria-hidden="true"
            inert
          >
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
