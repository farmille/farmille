"use client";

import { css, cx } from "../../../styled-system/css";
import { Icon } from "../Icon";
import { TourCardBody } from "./TourCardBody";
import {
  bottomSpaceStyle,
  riseStyle,
  useBottomSpace,
  useCardHandoff,
  useEntered,
  useHandoff,
} from "./tour-motion";

const barStyle = css({
  position: "fixed",
  zIndex: "guide",
  left: "3",
  right: "3",
  bottom: "calc(token(spacing.3) + env(safe-area-inset-bottom, 0px))",
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
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  boxShadow: "shadow.lift",
});

// 帯の上に出す「下へスクロール」。押すと画面を下へ送る
const hintStyle = css({
  position: "absolute",
  bottom: "calc(100% + token(spacing.3))",
  left: "0",
  right: "0",
  display: "flex",
  justifyContent: "center",
  pointerEvents: "none",
});
const hintButtonStyle = css({
  pointerEvents: "auto",
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  position: "relative",
  minH: "12",
  pl: "4",
  pr: "5",
  borderRadius: "pill",
  bg: "primary.700",
  color: "text.inverse",
  fontSize: "lg",
  fontWeight: "bold",
  // 周りに広がる輪で、押せるボタンだと分かるようにする
  _after: {
    content: '""',
    position: "absolute",
    inset: "0",
    borderRadius: "inherit",
    borderWidth: "3px",
    borderStyle: "solid",
    borderColor: "primary.700",
    animation: "tourRing",
    pointerEvents: "none",
    _motionReduce: { animation: "none", opacity: "0" },
  },
  boxShadow: "shadow.lift",
  cursor: "pointer",
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.700",
    outlineOffset: "2px",
  },
});
const nudgeStyle = css({ animation: "tourNudge", _motionReduce: { animation: "none" } });
export type TourBarProps = {
  /** 3段階のどこにいるか。帯の上に「チュートリアル中　1 / 3」と出す */
  section?: number;
  /** 帯の中で目立たせる1行 */
  title?: string;
  message: string;
  onSkipStep: () => void;
  onEnd: () => void;
  action?: { label: string; onClick: () => void };
  /** 帯の上に出す「下へスクロール」のボタン */
  scrollHint?: { label: string; onClick: () => void };
};

/** 画面を操作している間、説明をたたんで画面の下に出す細い帯。 */
export function TourBar({
  section,
  title,
  message,
  onSkipStep,
  onEnd,
  action,
  scrollHint,
}: TourBarProps) {
  const entered = useEntered(useHandoff().continuing);
  const { ref, space } = useBottomSpace<HTMLDivElement>();
  useCardHandoff(ref, true, false);
  return (
    <>
      <div aria-hidden="true" className={bottomSpaceStyle} style={{ "--tour-space": space }} />
      <div
        ref={ref}
        className={cx(barStyle, riseStyle)}
        data-entered={entered ? "" : undefined}
        role="status"
      >
        {scrollHint ? (
          <span className={hintStyle}>
            <button type="button" className={hintButtonStyle} onClick={scrollHint.onClick}>
              <Icon name="arrow_downward" size="md" className={nudgeStyle} />
              {scrollHint.label}
            </button>
          </span>
        ) : null}
        <TourCardBody
          section={section}
          title={title}
          body={message}
          primary={action}
          onSkipStep={onSkipStep}
          onEnd={onEnd}
        />
      </div>
    </>
  );
}
