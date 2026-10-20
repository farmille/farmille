"use client";

import { Button } from "@/components/Button";

import { css, cx } from "../../../styled-system/css";
import { TourEndButton } from "./TourEndButton";
import { TourLabel } from "./TourLabel";
import {
  bottomSpaceStyle,
  riseStyle,
  sentenceStyle,
  sentences,
  useBottomSpace,
  useCardHandoff,
  useEntered,
  useHandoff,
} from "./tour-motion";

const scrimStyle = css({
  position: "fixed",
  inset: "0",
  zIndex: "guide",
  bg: "scrim/45",
  // 幕は見た目だけ。案内を読まずに画面を操作する人もいるので、画面の操作はさえぎらない
  pointerEvents: "none",
  transitionProperty: "opacity",
  transitionDuration: "dialog",
  transitionTimingFunction: "out",
  opacity: "0",
  "&[data-entered]": { opacity: "1" },
});

const sheetStyle = css({
  position: "fixed",
  zIndex: "guide",
  left: "3",
  right: "3",
  bottom: "calc(token(spacing.3) + env(safe-area-inset-bottom, 0px))",
  mx: "auto",
  maxW: "guide",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "3.5",
  px: "5.5",
  pt: "3",
  pb: "5",
  bg: "surface.card",
  color: "text.default",
  borderRadius: "card",
  boxShadow: "shadow.lift",
  textAlign: "center",
});

const headStyle = css({
  alignSelf: "stretch",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "2",
  // 見出し行だけ左右の余白を詰め、ラベルと終了ボタンを1行に収める
  mx: "-3",
  "& > :last-child": { ml: "auto" },
});
const titleStyle = css({
  textStyle: "title",
  textWrap: "balance",
  wordBreak: "auto-phrase",
  // 案内の最初のシートだけ、見出しを大きくする
  "&[data-welcome]": { textStyle: "welcome" },
});
const bodyStyle = css({ textStyle: "body", color: "text.muted" });
const dotsStyle = css({ display: "flex", gap: "1.5" });
const dotStyle = css({
  w: "2",
  h: "2",
  borderRadius: "pill",
  bg: "border.default",
  "&[data-current]": { w: "4.5", bg: "primary.700" },
});
const actionsStyle = css({
  alignSelf: "stretch",
  display: "flex",
  flexDirection: "column",
  gap: "2.5",
});

export type TourSheetProps = {
  title: string;
  /** 案内の最初のシート。見出しを大きくする */
  welcome?: boolean;
  body: string;
  primaryLabel: string;
  onPrimary: () => void;
  /** 段階の何番目か（「1 / 3」と点で示す）。ようこそと終了では省く */
  section?: { current: number; total: number };
  /** 「この手順をスキップ」。段階のシートでだけ出す */
  onSkipStep?: () => void;
  /** 「チュートリアルを終了」。終了のシートでは省く */
  onEnd?: () => void;
};

/** 案内の各段階の始まりと終わりに、画面の下から出すシート。 */
export function TourSheet({
  title,
  welcome = false,
  body,
  primaryLabel,
  onPrimary,
  section,
  onSkipStep,
  onEnd,
}: TourSheetProps) {
  const handoff = useHandoff();
  const entered = useEntered(handoff.continuing);
  const dimmed = useEntered(handoff.dimmed);
  const state = entered ? "" : undefined;
  const { ref, space } = useBottomSpace<HTMLElement>();
  useCardHandoff(ref, true, true);
  return (
    <>
      <div aria-hidden="true" className={bottomSpaceStyle} style={{ "--tour-space": space }} />
      <div className={scrimStyle} data-entered={dimmed ? "" : undefined} aria-hidden="true" />
      <section
        ref={ref}
        data-tour-sheet=""
        className={cx(sheetStyle, riseStyle)}
        data-entered={state}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-sheet-title"
      >
        <div className={headStyle}>
          {section ? <TourLabel section={section.current} /> : <span />}
          {onEnd ? <TourEndButton onEnd={onEnd} /> : null}
        </div>
        <h2 id="tour-sheet-title" className={titleStyle} data-welcome={welcome ? "" : undefined}>
          {title}
        </h2>
        <p className={bodyStyle}>
          {sentences(body).map((line) => (
            <span key={line} className={sentenceStyle}>
              {line}
            </span>
          ))}
        </p>
        {section ? (
          <span className={dotsStyle} aria-hidden="true">
            {Array.from({ length: section.total }, (_, index) => (
              <span
                key={index}
                className={dotStyle}
                data-current={index + 1 === section.current ? "" : undefined}
              />
            ))}
          </span>
        ) : null}
        <div className={actionsStyle}>
          <Button onClick={onPrimary}>{primaryLabel}</Button>
          {onSkipStep ? (
            <Button variant="ghost" onClick={onSkipStep}>
              この手順をスキップ
            </Button>
          ) : null}
        </div>
      </section>
    </>
  );
}
