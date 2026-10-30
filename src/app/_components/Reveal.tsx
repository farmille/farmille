"use client";

import { type ReactNode } from "react";
import { useHomeReveal } from "@/lib/hooks/use-home-reveal";

import { cva, cx, type RecipeVariantProps } from "../../../styled-system/css";

/**
 * 隠すのは JS が動く環境だけにし、data-revealed が付いたら元の位置へ戻す。
 * 視覚効果を減らす設定では位置を動かさず、不透明度だけを変える。
 */
const revealRecipe = cva({
  base: {
    transitionProperty: "[opacity, transform]",
    transitionDuration: "reveal",
    transitionTimingFunction: "out",
    _scripted: { opacity: "0" },
    _revealed: { opacity: "1", transform: "none" },
  },
  variants: {
    effect: {
      rise: { _scripted: { _motionSafe: { transform: "translateY(token(spacing.8))" } } },
      // 便箋を机に置くように、少し傾いた位置から落ち着かせる
      settle: {
        _scripted: { _motionSafe: { transform: "translateY(token(spacing.12)) rotate(-3deg)" } },
      },
      fade: {},
    },
    delay: {
      "0": {},
      "1": { transitionDelay: "revealStep" },
      "2": { transitionDelay: "[calc({durations.revealStep} * 2)]" },
      "3": { transitionDelay: "[calc({durations.revealStep} * 3)]" },
      "4": { transitionDelay: "[calc({durations.revealStep} * 4)]" },
    },
  },
  defaultVariants: { effect: "rise", delay: "0" },
});

type RevealProps = NonNullable<RecipeVariantProps<typeof revealRecipe>> & {
  children: ReactNode;
  className?: string;
};

/**
 * スクロールで画面に入ったら一度だけ data-revealed を付ける。
 * 子孫は `_revealedWithin` の条件で同じ合図を受け取り、下線や文字の動きを続けられる。
 */
export function Reveal({ effect, delay, className, children }: RevealProps) {
  const { ref, revealed } = useHomeReveal();

  return (
    <div
      ref={ref}
      className={cx(revealRecipe({ effect, delay }), className)}
      data-revealed={revealed ? "" : undefined}
    >
      {children}
    </div>
  );
}
