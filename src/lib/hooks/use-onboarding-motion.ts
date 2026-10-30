"use client";

import { type RefObject, useEffect, useLayoutEffect, useRef, useReducer } from "react";

import { token } from "../../../styled-system/tokens";

/**
 * 表示した次の描画で true になる。案内の部品を下から・中央から出すときの合図に使う。
 * 前の段階から引き継いだ部品は、出直さないよう最初から true にする。
 */
export function useEntered(initiallyEntered = false): boolean {
  const [entered, setEntered] = useReducer(
    (_current: boolean, next: boolean) => next,
    initiallyEntered,
  );
  useEffect(() => {
    if (entered) return;
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [entered]);
  return entered;
}

// 段階が変わるときは、前のカードを消して次のカードを出し直すのではなく、
// 前のカードの位置から次の位置へ移し、中身だけを入れ替えて見せる
type Trace = { card: HTMLElement; rect: DOMRect; dimmed: boolean; at: number };
let shown: { dimmed: boolean } | null = null;
let left: Trace | null = null;
// 前のカードが消えてから、この時間のうちに次のカードが出たら引き継ぐ。スキップで画面を移るときの読み込みも含める
const HANDOFF_WINDOW = 1500;

function recentTrace(card: HTMLElement): Trace | null {
  if (left === null || left.card === card) return null;
  return performance.now() - left.at < HANDOFF_WINDOW ? left : null;
}

export type Handoff = {
  /** 前の段階のカードから引き継ぐか */
  continuing: boolean;
  /** 前の段階でも画面を暗くしていたか（幕を出し直さない） */
  dimmed: boolean;
};

/** 前の段階のカードがまだ出ているか、消えた直後か。最初の描画で一度だけ決める。 */
export function useHandoff(): Handoff {
  const [handoff] = useReducer(
    (_current: Handoff, next: Handoff) => next,
    undefined,
    () => {
      const previous =
        shown ?? (left !== null && performance.now() - left.at < HANDOFF_WINDOW ? left : null);
      return { continuing: previous !== null, dimmed: previous?.dimmed ?? false };
    },
  );
  return handoff;
}

const MOVE_MS = Number.parseFloat(token("durations.dialog"));
const FADE_MS = Number.parseFloat(token("durations.fast"));

/** 前のカードの位置から今の位置へ動かし、中身を浮かび上がらせる。動きを減らす設定では動かさず中身だけ。 */
function moveFrom(card: HTMLElement, from: DOMRect) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const to = card.getBoundingClientRect();
  if (!reduce) {
    card.animate(
      [
        { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)` },
        { transform: "translate(0, 0)" },
      ],
      { duration: MOVE_MS, easing: token("easings.out") },
    );
  }
  for (const child of card.children) {
    child.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: FADE_MS,
      delay: reduce ? 0 : MOVE_MS / 3,
      easing: token("easings.out"),
      fill: "backwards",
    });
  }
}

/**
 * カードが画面に出ている間を記録し、消えるときに位置を残す。
 * 前の段階のカードから引き継いだときは、その位置から動かす。ready は位置が決まったか（吹き出しは対象を測るまで待つ）。
 */
export function useCardHandoff(
  ref: RefObject<HTMLElement | null>,
  ready: boolean,
  dimmed: boolean,
): void {
  useLayoutEffect(() => {
    const card = ref.current;
    if (!ready || card === null) return;
    const previous = recentTrace(card);
    shown = { dimmed };
    if (previous !== null) moveFrom(card, previous.rect);
    return () => {
      shown = null;
      left = { card, rect: card.getBoundingClientRect(), dimmed, at: performance.now() };
    };
  }, [ref, ready, dimmed]);
}

// 資材ページの画面の下に固定された、投稿のバー（「実証詳細レポートを書く」「感想口コミを書く」）
const FIXED_POST_BAR = '[data-ui="responsive-fab-bar"]';

/** 画面の下に固定された投稿のバーが、画面の下から占める高さ（px）。バーが無い・固定でないときは 0。 */
export function fixedPostBarHeight(): number {
  const bar = document.querySelector(FIXED_POST_BAR);
  if (bar === null || getComputedStyle(bar).position !== "fixed") return 0;
  return Math.max(0, window.innerHeight - bar.getBoundingClientRect().top);
}

export type BottomSpace<T extends HTMLElement> = {
  ref: RefObject<T | null>;
  /** 余白の高さ。CSS 変数 --tour-space に渡す */
  space: string;
  /** 投稿のバーが占める高さ。CSS 変数 --tour-clear に渡し、案内をバーの上に出す */
  clear: string;
};

/**
 * 画面の下に固定した案内の高さぶん、ページの最後に余白を足す。
 * 案内に隠れたページの下端（「保存する」など）も、スクロールすれば案内の上に出せるようにする。
 * あわせて、画面の下に固定された投稿のバーの高さを測り、案内がバーを隠さないようにする。
 */
export function useBottomSpace<T extends HTMLElement>(): BottomSpace<T> {
  const ref = useRef<T>(null);
  const [height, setHeight] = useReducer((_current: number, next: number) => next, 0);
  // 最初の描画から持ち上げておき、案内がバーの下から跳ね上がらないようにする
  const [barHeight, setBarHeight] = useReducer(
    (_current: number, next: number) => next,
    undefined,
    fixedPostBarHeight,
  );
  // 資材ページはバーを読み込み後に描く。固定したバーが加わってもページの大きさは変わらないので、
  // ページの大きさの変化に加えて、要素の追加と削除でも測り直す
  useLayoutEffect(() => {
    const measure = () => setBarHeight(fixedPostBarHeight());
    measure();
    const resizes = new ResizeObserver(measure);
    resizes.observe(document.body);
    const mutations = new MutationObserver(measure);
    mutations.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", measure);
    return () => {
      resizes.disconnect();
      mutations.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  // 案内を持ち上げると画面の下からの高さが変わるので、持ち上げた後の位置で測る
  useLayoutEffect(() => {
    const element = ref.current;
    if (element === null) return;
    const measure = () => setHeight(window.innerHeight - element.getBoundingClientRect().top);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [barHeight]);
  return { ref, space: `${Math.max(0, height)}px`, clear: `${barHeight}px` };
}
