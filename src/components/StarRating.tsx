"use client";

import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";

import { EnsureFieldRoot } from "./form/Field";
import { useFieldRequired, useResetKey } from "./form/field-context";
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

const inputRowStyle = css({ display: "flex", gap: "2", alignItems: "center" });

const inputStarRecipe = cva({
  base: {
    display: "flex",
    lineHeight: "none",
    borderRadius: "mark",
    cursor: "pointer",
    outline: "none",
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary.700",
      outlineOffset: "0.5",
    },
  },
  variants: {
    on: {
      true: { color: "accent.star" },
      false: { color: "border.strong" },
    },
  },
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
  /** 送信名。囲む Fieldset・Field に name があればそちらが優先される。 */
  name?: string;
};

export type StarRatingProps = StarDisplayProps | StarInputProps;

function clampInt(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(5, Math.round(n)));
}

/** 評価の星を表示し、入力時はタップで1〜5を選択する。 */
export function StarRating(props: StarRatingProps) {
  if (props.mode === "input") return <StarInput {...props} />;

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
            size={props.size === "lg" ? "md" : "sm"}
          />
        ))}
      </span>
      {showValue ? <span className={valueRecipe({ size: props.size })}>{formatted}</span> : null}
    </span>
  );
}

function StarInput({ value, onChange, className, name }: StarInputProps) {
  const required = useFieldRequired();
  const resetKey = useResetKey("");
  const rating = clampInt(value);
  const group = (
    <BaseRadioGroup<number | null>
      aria-label="評価"
      key={resetKey}
      className={cx(inputRowStyle, className)}
      name={name}
      onValueChange={(next) => onChange(next ?? 0)}
      required={required}
      value={rating === 0 ? null : rating}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <BaseRadio.Root
          aria-label={`${n}`}
          className={inputStarRecipe({ on: n <= rating })}
          key={n}
          value={n}
        >
          <Icon name="star_filled" size="2xl" />
        </BaseRadio.Root>
      ))}
    </BaseRadioGroup>
  );

  return <EnsureFieldRoot name={name}>{group}</EnsureFieldRoot>;
}
