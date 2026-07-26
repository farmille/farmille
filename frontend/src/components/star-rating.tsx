"use client";

import { cva, css, cx } from "../../styled-system/css";

const displayRecipe = cva({
  base: {
    color: "accent.star",
    fontSize: "sm",
    letterSpacing: "1px",
    display: "inline-flex",
    alignItems: "center",
    gap: "0",
  },
  variants: {
    size: {
      sm: { fontSize: "sm" },
      lg: { fontSize: "2xl", gap: "2", letterSpacing: "0" },
    },
  },
  defaultVariants: {
    size: "sm",
  },
});

const inputStar = css({
  borderWidth: "0",
  bg: "transparent",
  padding: "0",
  cursor: "pointer",
  fontSize: "32px",
  lineHeight: "1",
  color: "accent.star",
});

const inputStarOff = css({
  color: "border.strong",
});

type StarDisplayProps = {
  mode?: "display";
  /** 整数 0〜5。0.5 刻みは表示しない（T-21）。 */
  value: number;
  size?: "sm" | "lg";
  className?: string;
};

type StarInputProps = {
  mode: "input";
  value: number;
  onChange: (value: number) => void;
  className?: string;
  name?: string;
};

export type StarRatingProps = StarDisplayProps | StarInputProps;

function clampInt(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(5, Math.round(n)));
}

/** ★表示（整数）と入力（タップで 1〜5）。 */
export function StarRating(props: StarRatingProps) {
  if (props.mode === "input") {
    const value = clampInt(props.value);
    return (
      <div
        className={cx(css({ display: "flex", gap: "2", alignItems: "center" }), props.className)}
        role="radiogroup"
        aria-label="評価"
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const on = n <= value;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${n}`}
              className={cx(inputStar, !on && inputStarOff)}
              onClick={() => props.onChange(n)}
            >
              ★
            </button>
          );
        })}
        {props.name ? <input type="hidden" name={props.name} value={value} /> : null}
      </div>
    );
  }

  const value = clampInt(props.value);
  const filled = "★".repeat(value);
  const empty = "☆".repeat(5 - value);
  return (
    <span
      className={cx(displayRecipe({ size: props.size }), props.className)}
      aria-label={`評価 ${value}`}
    >
      {filled}
      {empty}
    </span>
  );
}
