import {
  type CSSProperties,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { css } from "../../../styled-system/css";
import { token } from "../../../styled-system/tokens";

/**
 * 表示した次の描画で true になる。案内の部品を下から・中央から出すときの合図に使う。
 * 前の段階から引き継いだ部品は、出直さないよう最初から true にする。
 */
export function useEntered(initiallyEntered = false): boolean {
  const [entered, setEntered] = useState(initiallyEntered);
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
  const [handoff] = useState<Handoff>(() => {
    const previous =
      shown ?? (left !== null && performance.now() - left.at < HANDOFF_WINDOW ? left : null);
    return { continuing: previous !== null, dimmed: previous?.dimmed ?? false };
  });
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

/** 案内の部品の出方。transform と opacity だけを動かし、動きを減らす設定では不透明度だけを変える。 */
export const riseStyle = css({
  transitionProperty: "opacity, transform",
  transitionDuration: "dialog",
  transitionTimingFunction: "out",
  opacity: "0",
  transform: "translateY(16px)",
  "&[data-entered]": { opacity: "1", transform: "none" },
  _motionReduce: { transform: "none" },
});

/**
 * 画面の下に固定した案内の高さぶん、ページの最後に余白を足す。
 * 案内に隠れたページの下端（「保存する」など）も、スクロールすれば案内の上に出せるようにする。
 */
export type BottomSpace<T extends HTMLElement> = {
  ref: RefObject<T | null>;
  spaceStyle: CSSProperties & { "--tour-space": string };
};

export function useBottomSpace<T extends HTMLElement>(): BottomSpace<T> {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState(0);
  useEffect(() => {
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
  }, []);
  return { ref, spaceStyle: { "--tour-space": `${Math.max(0, height)}px` } };
}

/** ページの最後に置く余白。高さは useBottomSpace で決める */
export const bottomSpaceStyle = css({ h: "var(--tour-space)", pointerEvents: "none" });

/** 文ごとに行を分ける。短い案内が文の途中で折り返して読みにくくならないようにする。 */
export function sentences(text: string): string[] {
  return text.split(/(?<=。)/).filter((part) => part.trim() !== "");
}

export const sentenceStyle = css({ display: "block", wordBreak: "auto-phrase" });
