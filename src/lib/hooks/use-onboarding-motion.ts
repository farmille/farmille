"use client";

import { useCallback, useReducer } from "react";
import { flushSync } from "react-dom";

import { token } from "../../../styled-system/tokens";
import { useMountEffect } from "./use-mount-effect";

/**
 * 表示した次の描画で true になる。案内の部品を下から・中央から出すときの合図に使う。
 * 前の段階から引き継いだ部品は、出直さないよう最初から true にする。
 */
export function useEntered(initiallyEntered = false): boolean {
  const [entered, setEntered] = useReducer(
    (_current: boolean, next: boolean) => next,
    initiallyEntered,
  );
  useMountEffect(() => {
    if (initiallyEntered) return;
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  });
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
 * カードが画面に出ている間を記録し、消えるときに位置を残す。返す関数で後片付けする。
 * 前の段階のカードから引き継いだときは、その位置から動かす。カードの位置が決まった描画の直後（描く前）に呼ぶ。
 */
export function handOff(card: HTMLElement, dimmed: boolean): () => void {
  const previous = recentTrace(card);
  shown = { dimmed };
  if (previous !== null) moveFrom(card, previous.rect);
  return () => {
    shown = null;
    left = { card, rect: card.getBoundingClientRect(), dimmed, at: performance.now() };
  };
}

// 資材ページの画面の下に固定された、投稿のバー（「実証詳細レポートを書く」「感想口コミを書く」）
const FIXED_POST_BAR = '[data-ui="responsive-fab-bar"]';

/** 画面の下に固定された投稿のバーが、画面の下から占める高さ（px）。バーが無い・固定でないときは 0。 */
export function fixedPostBarHeight(): number {
  const bar = document.querySelector(FIXED_POST_BAR);
  if (bar === null || getComputedStyle(bar).position !== "fixed") return 0;
  return Math.max(0, window.innerHeight - bar.getBoundingClientRect().top);
}

export type Dock<T extends HTMLElement> = {
  /** 画面の下に固定する案内に付ける ref */
  ref: (element: T) => () => void;
  /** 余白の高さ。CSS 変数 --tour-space に渡す */
  space: string;
  /** 投稿のバーが占める高さ。CSS 変数 --tour-clear に渡し、案内をバーの上に出す */
  clear: string;
};

/**
 * 画面の下に固定した案内の高さぶん、ページの最後に余白を足す。
 * 案内に隠れたページの下端（「保存する」など）も、スクロールすれば案内の上に出せるようにする。
 * あわせて、画面の下に固定された投稿のバーの高さを測り、案内がバーを隠さないようにする。
 * 前の段階のカードからの引き継ぎ（handOff）も、同じ ref で行う。dimmed は画面を暗くする案内か。
 */
export function useDock<T extends HTMLElement>(dimmed: boolean): Dock<T> {
  const [height, setHeight] = useReducer((_current: number, next: number) => next, 0);
  // 最初の描画から持ち上げておき、案内がバーの下から跳ね上がらないようにする
  const [barHeight, setBarHeight] = useReducer(
    (_current: number, next: number) => next,
    undefined,
    fixedPostBarHeight,
  );
  const ref = useCallback(
    (element: T) => {
      const measureSpace = () =>
        setHeight(window.innerHeight - element.getBoundingClientRect().top);
      let bar = fixedPostBarHeight();
      setBarHeight(bar);
      measureSpace();
      // 資材ページはバーを読み込み後に描く。固定したバーが加わってもページの大きさは変わらないので、
      // ページの大きさの変化に加えて、要素の追加と削除でも測り直す。
      // 案内を持ち上げると画面の下からの高さが変わるので、持ち上げを先に反映し、持ち上げた後の位置で測る
      const measure = () => {
        const next = fixedPostBarHeight();
        if (next !== bar) {
          bar = next;
          flushSync(() => setBarHeight(next));
        }
        measureSpace();
      };
      const resizes = new ResizeObserver(measure);
      resizes.observe(document.body);
      resizes.observe(element);
      const mutations = new MutationObserver(measure);
      mutations.observe(document.body, { childList: true, subtree: true });
      window.addEventListener("resize", measure);
      const leave = handOff(element, dimmed);
      return () => {
        leave();
        resizes.disconnect();
        mutations.disconnect();
        window.removeEventListener("resize", measure);
      };
    },
    [dimmed],
  );
  return { ref, space: `${Math.max(0, height)}px`, clear: `${barHeight}px` };
}
