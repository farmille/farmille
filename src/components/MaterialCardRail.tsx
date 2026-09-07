import type { ReactNode } from "react";

import { css, cx } from "../../styled-system/css";

const rail = css({
  display: "flex",
  gap: "2.5",
  overflowX: "auto",
  scrollSnapType: "x mandatory",
  pb: "1.5",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
  lg: {
    flexWrap: "wrap",
    overflowX: "visible",
    scrollSnapType: "none",
    pb: "0",
  },
});

export type MaterialCardRailProps = {
  children: ReactNode;
  className?: string;
};

/** 資材カードを、スマホでは横送り、PCではコンパクトな折り返し行として配置する。 */
export function MaterialCardRail({ children, className }: MaterialCardRailProps) {
  return (
    <div className={cx(rail, className)} data-ui="material-card-rail">
      {children}
    </div>
  );
}
