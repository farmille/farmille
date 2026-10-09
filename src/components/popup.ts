import { css, cva } from "../../styled-system/css";

/**
 * Base UI の Positioner は位置合わせに transform を使い、重なりの文脈を作る。
 * Popup 側の z-index は Positioner の中でしか効かないので、重なり順は Positioner に置く。
 * ダイアログの中で開いた一覧はダイアログの Portal の末尾に置かれるので、ダイアログと同じ重なり順にして
 * 後に置かれた一覧を手前に出す（popup の 40 ではダイアログ本体の裏に隠れる）。
 */
export const popupPositionerStyle = css({ zIndex: "dialog", outline: "none" });

/**
 * メニュー・セレクトのように操作部品から開く面。
 * 開いた部品の位置（--transform-origin）から広がり、同じ経路で閉じる。
 */
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
        transitionProperty: "opacity, transform",
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
        // Escape など Base UI が即時と判断した開閉（data-instant）は動かさない
        "&[data-instant]": { transitionDuration: "0s" },
      },
      // キーボードで開いて打鍵ごとに描き直す候補リストは動かさない
      none: {},
    },
  },
  defaultVariants: { motion: "scale" },
});

/** ポップアップ内の選択肢1行。 */
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
    _highlighted: { bg: "primary.soft", color: "primary.700" },
    _selected: { fontWeight: "bold" },
  },
});

/** 選択肢の補足（「トマト なす科果菜類」の後半）。 */
export const optionDescriptionStyle = css({ fontSize: "xs", color: "text.subtle" });
