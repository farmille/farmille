"use client";

import { useRef } from "react";
import { useBringIntoView, useSpot } from "@/lib/hooks/use-onboarding-spot";

import { css, cva, cx } from "../../../styled-system/css";
import { TourCardBody } from "./TourCardBody";
import { riseStyle } from "./tour-motion";
import { useCardHandoff, useEntered, useHandoff } from "@/lib/hooks/use-onboarding-motion";

// 画面に固定・貼り付く対象には画面へ、ページの中の対象にはページへ留め、ページの中の対象はスクロールで遅れずに一緒に動くようにする
const anchorRecipe = cva({
  variants: {
    anchor: { viewport: { position: "fixed" }, page: { position: "absolute" } },
  },
});

// 光らせる枠。周りを暗くする幕は枠の影で描き、画面の操作はさえぎらない（pointer-events: none）
const spotStyle = css({
  zIndex: "guide",
  top: "var(--tour-spot-top)",
  left: "var(--tour-spot-left)",
  w: "var(--tour-spot-width)",
  h: "var(--tour-spot-height)",
  borderRadius: "card",
  pointerEvents: "none",
  boxShadow: "shadow.spotlight",
  transitionProperty: "[opacity]",
  transitionDuration: "dialog",
  transitionTimingFunction: "out",
  opacity: "0",
  "&[data-entered]": { opacity: "1" },
  // 押してほしいボタンのときは、枠の外へ広がる輪を重ねて目立たせる
  "&[data-pulse]::after": {
    content: '""',
    position: "absolute",
    inset: "0",
    borderRadius: "[inherit]",
    borderWidth: "3px",
    borderStyle: "solid",
    borderColor: "surface.card",
    animation: "tourRing",
    _motionReduce: { animation: "none", opacity: "0" },
  },
});

const cardStyle = css({
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
  const handoff = useHandoff();
  const entered = useEntered(handoff.continuing);
  const lit = useEntered(handoff.dimmed);
  useCardHandoff(card, box !== null, true);
  if (target === null) return null;
  const state = entered && box !== null ? "" : undefined;
  const spotState = lit && box !== null ? "" : undefined;
  const anchor = anchorRecipe({ anchor: box?.anchor ?? "viewport" });
  // 実行時に決まる位置は CSS 変数で渡し、スタイル側は var() で受ける
  return (
    <>
      <div
        className={cx(anchor, spotStyle)}
        style={{
          "--tour-spot-top": `${box?.top ?? 0}px`,
          "--tour-spot-left": `${box?.left ?? 0}px`,
          "--tour-spot-width": `${box?.width ?? 0}px`,
          "--tour-spot-height": `${box?.height ?? 0}px`,
        }}
        data-entered={spotState}
        data-pulse={pulse ? "" : undefined}
        aria-hidden="true"
      />
      <section
        ref={card}
        data-tour-tip=""
        className={cx(anchor, cardStyle, riseStyle)}
        style={{ "--tour-card-top": `${box?.cardTop ?? 0}px` }}
        data-entered={state}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-tip-title"
      >
        <TourCardBody
          section={section}
          title={title}
          titleId="tour-tip-title"
          body={body}
          primary={primary}
          onSkipStep={onSkipStep}
          onEnd={onEnd}
        />
      </section>
    </>
  );
}
