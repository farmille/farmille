"use client";
import { useEffect, useLayoutEffect, useReducer, type RefObject } from "react";

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
export function useBringIntoView(target: Element | null) {
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
export function useSpot(target: Element | null, card: RefObject<HTMLElement | null>): Box | null {
  const [box, setBox] = useReducer((_current: Box | null, next: Box | null) => next, null);
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
