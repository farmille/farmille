"use client";

import { Icon } from "@/components/Icon";

import { css } from "../../../styled-system/css";
import { useEntered } from "@/lib/hooks/use-onboarding-motion";

const boxStyle = css({
  position: "fixed",
  zIndex: "guide",
  top: "[50%]",
  left: "[50%]",
  w: "[min(18rem, calc(100% - token(spacing.12)))]",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "2.5",
  px: "5",
  py: "5.5",
  bg: "surface.card",
  color: "text.default",
  borderRadius: "card",
  boxShadow: "shadow.lift",
  textAlign: "center",
  pointerEvents: "none",
  transitionProperty: "[opacity, transform]",
  transitionDuration: "dialog",
  transitionTimingFunction: "out",
  opacity: "0",
  transform: "translate(-50%, -50%) scale(0.94)",
  "&[data-entered]": { opacity: "1", transform: "translate(-50%, -50%)" },
  _motionReduce: { transform: "translate(-50%, -50%)" },
});

const checkStyle = css({
  display: "grid",
  placeItems: "center",
  w: "14",
  h: "14",
  borderRadius: "pill",
  bg: "primary.700",
  color: "text.inverse",
});
const titleStyle = css({ textStyle: "body", fontWeight: "bold" });

/** 保存できたことを、チェックの印と一緒に短く伝える。 */
export function TourSaved({ title }: { title: string }) {
  const entered = useEntered();
  return (
    <div className={boxStyle} data-entered={entered ? "" : undefined} role="status">
      <span className={checkStyle}>
        <Icon name="check" size="lg" />
      </span>
      <p className={titleStyle}>{title}</p>
    </div>
  );
}
