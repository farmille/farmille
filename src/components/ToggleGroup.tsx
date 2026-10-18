"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";

import { cx, sva } from "../../styled-system/css";
import { choiceGroupRecipe, choiceRecipe } from "./form/recipes";
import type { Option } from "./form/types";

const focusRing = {
  outlineWidth: "2px",
  outlineStyle: "solid",
  outlineColor: "primary.700",
  outlineOffset: "2px",
} as const;

const toggleGroupRecipe = sva({
  slots: ["frame", "group", "item"],
  base: { item: { fontFamily: "sans", _focusVisible: focusRing } },
  variants: {
    variant: {
      chips: {
        group: choiceGroupRecipe.raw({ variant: "chips" }),
        item: {
          ...choiceRecipe.raw({ look: "chip" }),
          _pressed: { borderColor: "primary.600", bg: "primary.soft", color: "text.brandOnSoft" },
        },
      },
      timeline: {
        frame: {
          position: "relative",
          _after: {
            content: '""',
            position: "absolute",
            top: "0",
            right: "0",
            bottom: "0",
            w: "9",
            bgImage: "linear-gradient(to right, transparent, {colors.surface.page})",
            pointerEvents: "none",
          },
          tab: { _after: { display: "none" } },
        },
        group: {
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
          overflowX: "auto",
          pt: "1.5",
          pb: "0.5",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          _before: {
            content: '""',
            position: "absolute",
            top: "3.5",
            left: "5",
            right: "5",
            h: "0.5",
            bg: "border.strong",
          },
        },
        item: {
          position: "relative",
          flexGrow: "1",
          flexShrink: "0",
          flexBasis: "20",
          borderWidth: "0",
          bg: "transparent",
          pt: "6.5",
          fontSize: "xs",
          lineHeight: "snug",
          color: "text.subtle",
          textAlign: "center",
          cursor: "pointer",
          userSelect: "none",
          _before: {
            content: '""',
            position: "absolute",
            top: "2",
            left: "50%",
            w: "4",
            h: "4",
            ml: "-2",
            borderWidth: "2px",
            borderStyle: "solid",
            borderColor: "border.strong",
            borderRadius: "pill",
            bg: "surface.card",
          },
          _hover: { _before: { borderColor: "primary.700" } },
          _pressed: {
            color: "text.brand",
            fontWeight: "extrabold",
            _before: { bg: "primary.700", borderColor: "primary.700" },
          },
          _disabled: { opacity: "disabled", cursor: "not-allowed" },
        },
      },
    },
  },
  defaultVariants: { variant: "chips" },
});

type ToggleGroupProps<V extends string> = {
  options: readonly Option<V>[];
  value: readonly V[];
  onValueChange: (value: V[]) => void;
  /** 省くと1つだけ押せる（押し直すと外れる）。 */
  multiple?: boolean;
  /** multiple で押せる数の上限。達すると、押していない選択肢を押せなくする。 */
  limit?: number;
  /** timeline は順に並ぶ段階（施用時期など）を線の上の点で示す。 */
  variant?: "chips" | "timeline";
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
  variant,
  disabled,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  className,
}: ToggleGroupProps<V>) {
  const full = multiple && limit !== undefined && value.length >= limit;
  const styles = toggleGroupRecipe({ variant });

  return (
    <div className={cx(styles.frame, className)}>
      <BaseToggleGroup<V>
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        className={styles.group}
        disabled={disabled}
        multiple={multiple}
        onValueChange={(next) =>
          onValueChange(
            options.filter((option) => next.includes(option.value)).map((option) => option.value),
          )
        }
        value={value}
      >
        {options.map((option) => (
          <Toggle<V>
            className={styles.item}
            disabled={option.disabled === true || (full && !value.includes(option.value))}
            key={option.value}
            value={option.value}
          >
            {option.label}
          </Toggle>
        ))}
      </BaseToggleGroup>
    </div>
  );
}
