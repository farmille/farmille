import { css, cva } from "../../styled-system/css";

/**
 * Base UI の Positioner は位置合わせに transform を使い、重なりの文脈を作る。
 * Popup 側の z-index は Positioner の中でしか効かないので、重なり順は Positioner に置く。
 * ダイアログの中で開いた一覧はダイアログの Portal の末尾に置かれるので、ダイアログと同じ重なり順にして
 * 後に置かれた一覧を手前に出す。
 */
export const popupPositionerStyle = css({ zIndex: "dialog", outline: "none" });

export const popupRecipe = cva({
  base: {
    bg: "surface.card",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    borderRadius: "card",
    boxShadow: "overlay",
    p: "1",
    maxH: "var(--available-height)",
    overflowY: "auto",
    minW: "var(--anchor-width)",
    transformOrigin: "var(--transform-origin)",
    outline: "none",
  },
  variants: {
    motion: {
      scale: {
        transitionProperty: "[opacity, transform]",
        transitionDuration: "fast",
        transitionTimingFunction: "out",
        _startingStyle: {
          opacity: "0",
          transform: "scale(0.95)",
          _motionReduce: { transform: "none" },
        },
        _endingStyle: {
          opacity: "0",
          transform: "scale(0.95)",
          _motionReduce: { transform: "none" },
        },
        "&[data-instant]": { transitionDuration: "[0s]" },
      },
      none: {},
    },
  },
  defaultVariants: { motion: "scale" },
});

export const optionRecipe = cva({
  base: {
    display: "flex",
    alignItems: "center",
    gap: "2",
    px: "3",
    py: "2.5",
    borderRadius: "input",
    fontSize: "sm",
    color: "text.default",
    cursor: "default",
    outline: "none",
    userSelect: "none",
    _highlighted: { bg: "primary.soft", color: "text.brandOnSoft" },
    _selected: { fontWeight: "bold" },
    _disabled: { opacity: "disabled", cursor: "not-allowed" },
  },
});

export const optionDescriptionStyle = css({ fontSize: "xs", color: "text.subtle" });
