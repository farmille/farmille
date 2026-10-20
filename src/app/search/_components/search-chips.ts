import { css } from "../../../../styled-system/css";

export const chipList = css.raw({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
  pt: "0.5",
  pb: "1.5",
});

export const chipListStyle = css(chipList);

export const focusRing = css.raw({
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.700",
    outlineOffset: "0.5",
  },
});
