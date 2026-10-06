"use client";

import { Icon } from "./Icon";

import { cva, css, cx } from "../../styled-system/css";

const displayRowRecipe = cva({
  base: {
    color: "accent.star",
    display: "inline-flex",
    alignItems: "center",
  },
  variants: {
    withValue: {
      true: { gap: "2" },
      false: { gap: "0" },
    },
  },
  defaultVariants: {
    withValue: false,
  },
});

const starsStyle = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "0",
});

const valueRecipe = cva({
  base: {
    // 既定の行間だと数字の箱が字形より高い。line-height を 1 に畳み、星と同じ高さ基準で中央揃えする。
    display: "inline-flex",
    alignItems: "center",
    lineHeight: "none",
    fontWeight: "extrabold",
    fontVariantNumeric: "tabular-nums",
  },
  variants: {
    size: {
      sm: { fontSize: "md" },
      lg: { fontSize: "lg" },
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
  lineHeight: "none",
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
  /** 星の右に小数1桁の評価値を並べる。 */
  showValue?: boolean;
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

/** 評価の星を表示し、入力時はタップで1〜5を選択する。 */
export function StarRating(props: StarRatingProps) {
  if (props.mode === "input") {
    const value = clampInt(props.value);
    return (
      <div
        className={cx(css({ display: "flex", gap: "0", alignItems: "center" }), props.className)}
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
              aria-checked={n === value}
              aria-label={`${n}`}
              className={cx(inputStar, !on && inputStarOff)}
              onClick={() => props.onChange(n)}
            >
              <Icon name="star_filled" size="2xl" />
            </button>
          );
        })}
        {props.name ? <input type="hidden" name={props.name} value={value} /> : null}
      </div>
    );
  }

  const value = clampInt(props.value);
  const showValue = props.showValue === true;
  const formatted = Number.isFinite(props.value) ? props.value.toFixed(1) : "0.0";
  return (
    <span
      className={cx(displayRowRecipe({ withValue: showValue }), props.className)}
      role="img"
      aria-label={showValue ? `評価 ${formatted}` : `評価 ${value}`}
    >
      <span className={starsStyle}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Icon
            key={n}
            name={n <= value ? "star_filled" : "star"}
            // sm は本文（md=14px）の横に置く。Material アイコンの内余白を見込んで 16px。
            size={props.size === "lg" ? "md" : "sm"}
          />
        ))}
      </span>
      {showValue ? <span className={valueRecipe({ size: props.size })}>{formatted}</span> : null}
    </span>
  );
}
