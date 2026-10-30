"use client";

import { useEffect, useReducer, useRef } from "react";

/** 1セット分を流し切る周期。 */
const LOOP_MS = 55_000;
/** カーソルを乗せている間の再生速度。 */
const HOVER_RATE = 0.25;
/** 再生速度が目標へ寄る時定数。乗せたときも外したときも、この長さで滑らかに変わる。 */
const RATE_EASE_MS = 200;
/** 目標との差がこれ未満になったら、目標へ揃えて補間を終える。 */
const RATE_SETTLE = 0.005;
/** これを超えて動いたらタップではなく横ドラッグとして扱う。 */
const DRAG_THRESHOLD_PX = 4;

type MarqueeMode = "marquee" | "static";

/** 周期内に収まるよう再生位置を正規化する。 */
function wrapTime(time: number): number {
  return ((time % LOOP_MS) + LOOP_MS) % LOOP_MS;
}

/**
 * 再生速度を目標へ指数的に寄せた次の値。段差なく加減速する。
 * 途中で目標が変わっても現在の速度から続くので、乗せ外しを素早く繰り返しても速度が跳ばない。
 */
export function easeRate(current: number, target: number, elapsedMs: number): number {
  const gap = target - current;
  if (Math.abs(gap) < RATE_SETTLE) return target;
  return current + gap * (1 - Math.exp(-elapsedMs / RATE_EASE_MS));
}

export function useHomeMaterialMarquee() {
  const frameRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useReducer((_state: MarqueeMode, next: MarqueeMode) => next, "marquee");

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

    let targetRate = 1;
    let rateFrame = 0;
    let lastTick = 0;
    const stepRate = (now: number) => {
      const next = easeRate(animation.playbackRate, targetRate, Math.max(0, now - lastTick));
      lastTick = now;
      animation.playbackRate = next;
      rateFrame = next === targetRate ? 0 : requestAnimationFrame(stepRate);
    };
    const easeRateTo = (rate: number) => {
      targetRate = rate;
      if (rateFrame !== 0) return;
      lastTick = performance.now();
      rateFrame = requestAnimationFrame(stepRate);
    };

    const handlePointerEnter = (event: PointerEvent) => {
      // タッチのタップで減速したまま戻らなくなるのを避ける。
      if (event.pointerType !== "mouse") return;
      easeRateTo(HOVER_RATE);
    };
    const handlePointerLeave = () => {
      easeRateTo(1);
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
      cancelAnimationFrame(rateFrame);
      animation.cancel();
    };
  }, [mode]);
  return { frameRef, trackRef, setRef, mode };
}
