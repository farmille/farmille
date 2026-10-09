"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";

import { css, cx } from "../../styled-system/css";
import { choiceGroupRecipe, choiceRecipe } from "./form/recipes";
import type { Option } from "./form/types";

// CheckboxGroup のチップと同じ見た目。チェックの代わりに押した状態（aria-pressed）で色を変える
const toggleChipStyle = css(choiceRecipe.raw({ look: "chip" }), {
  fontFamily: "sans",
  _pressed: { borderColor: "primary.600", bg: "primary.soft", color: "primary.700" },
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.700",
    outlineOffset: "2px",
  },
});

type ToggleGroupProps<V extends string> = {
  options: readonly Option<V>[];
  value: readonly V[];
  onValueChange: (value: V[]) => void;
  /** 省くと1つだけ押せる（押し直すと外れる）。 */
  multiple?: boolean;
  /** multiple で押せる数の上限。達すると、押していない選択肢を押せなくする。 */
  limit?: number;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
};

/**
 * 画面の状態として持つ押しボタンの組（送信値にはならない）。各ボタンは aria-pressed で状態を伝え、
 * 組の中は矢印キーで移る。フォームで送る複数選択は CheckboxGroup を使う。
 */
export function ToggleGroup<V extends string>({
  options,
  value,
  onValueChange,
  multiple = false,
  limit,
  disabled,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  className,
}: ToggleGroupProps<V>) {
  const full = multiple && limit !== undefined && value.length >= limit;

  return (
    <BaseToggleGroup<V>
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      className={cx(choiceGroupRecipe({ variant: "chips" }), className)}
      disabled={disabled}
      multiple={multiple}
      onValueChange={(next) =>
        // 押した順ではなく選択肢の並びで返す
        onValueChange(
          options.filter((option) => next.includes(option.value)).map((option) => option.value),
        )
      }
      value={value}
    >
      {options.map((option) => (
        <Toggle<V>
          className={toggleChipStyle}
          disabled={option.disabled === true || (full && !value.includes(option.value))}
          key={option.value}
          value={option.value}
        >
          {option.label}
        </Toggle>
      ))}
    </BaseToggleGroup>
  );
}
