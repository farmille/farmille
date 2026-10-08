import { css } from "../../styled-system/css";

/** Farmille のロゴマーク（葉）。アイコンではなくロゴなので SVG のまま保持する。 */
export function BrandMark() {
  return (
    <svg
      viewBox="0 0 32 32"
      className={css({
        display: "inline-block",
        flexShrink: "0",
        verticalAlign: "middle",
        width: "icon.lg",
        height: "icon.lg",
        fill: "currentColor",
      })}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M26 5C14 5 6 12 6 22c0 2 .4 3.6 1 5 6-9 12-12 18-13-5 2.5-9 6.5-12 13 1 .3 2.3.5 4 .5 8 0 13-6 13-15 0-4-1-7-4-8z" />
    </svg>
  );
}
