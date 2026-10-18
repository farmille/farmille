import { type CSSProperties, type RefObject, useEffect, useRef, useState } from "react";

import { css } from "../../../styled-system/css";

/** 表示した次の描画で true になる。案内の部品を下から・中央から出すときの合図に使う。 */
export function useEntered(): boolean {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  return entered;
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
