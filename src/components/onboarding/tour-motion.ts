import { css } from "../../../styled-system/css";

/** 案内の部品の出方。transform と opacity だけを動かし、動きを減らす設定では不透明度だけを変える。 */
export const riseStyle = css({
  transitionProperty: "[opacity, transform]",
  transitionDuration: "dialog",
  transitionTimingFunction: "out",
  opacity: "0",
  transform: "translateY(16px)",
  "&[data-entered]": { opacity: "1", transform: "none" },
  _motionReduce: { transform: "none" },
});

/** ページの最後に置く余白。高さは useDock で決める */
export const bottomSpaceStyle = css({ h: "var(--tour-space)", pointerEvents: "none" });

/**
 * 画面の下に固定する案内の置き場所。タブレット以上で投稿のバーがあるときは、その上（--tour-clear の高さ）に出す。
 * スマートフォンでは、案内が幅いっぱいの投稿のバーに重なってよい（バーの上に浮かせると、案内と画面の内容の区別が付きにくい）。
 */
export const dockStyle = css({
  position: "fixed",
  zIndex: "guide",
  left: "3",
  right: "3",
  bottom: "[calc(token(spacing.3) + env(safe-area-inset-bottom, 0px))]",
  mx: "auto",
  maxW: "guide",
  tab: {
    bottom:
      "[max(calc(token(spacing.3) + env(safe-area-inset-bottom, 0px)), calc(var(--tour-clear) + token(spacing.3)))]",
  },
});

/** 文ごとに行を分ける。短い案内が文の途中で折り返して読みにくくならないようにする。 */
export function sentences(text: string): string[] {
  return text.split(/(?<=。)/).filter((part) => part.trim() !== "");
}

export const sentenceStyle = css({ display: "block", wordBreak: "auto-phrase" });
