"use client";

import { Input as BaseInput } from "@base-ui/react/input";

import { Icon } from "@/components/Icon";
import { cva, cx } from "../../../styled-system/css";

export const searchBoxRecipe = cva({
  base: {
    display: "flex",
    alignItems: "center",
    gap: "2",
    w: "full",
    minW: "0",
    px: "3",
    cursor: "text",
    "&:has(input:disabled)": { opacity: "disabled", cursor: "not-allowed" },
  },
  variants: {
    size: {
      md: { minH: "11" },
      lg: { minH: "12" },
    },
    surface: {
      plain: {
        bg: "surface.card",
        borderWidth: "1.5px",
        borderStyle: "solid",
        borderColor: "border.strong",
        borderRadius: "button",
        color: "text.subtle",
        "&:has(input:focus-visible)": {
          borderColor: "primary.600",
          outlineWidth: "2px",
          outlineStyle: "solid",
          outlineColor: "primary.200",
        },
      },
      raised: {
        gap: "3",
        pl: "5",
        pr: "2",
        bg: "surface.card",
        borderRadius: "pill",
        boxShadow: "shadow.lift",
        color: "text.brand",
        tab: { minH: "16", pl: "6", pr: "2.5" },
      },
    },
  },
  defaultVariants: { size: "md", surface: "plain" },
});

export const searchFieldRecipe = cva({
  base: {
    flex: "1",
    minW: "0",
    alignSelf: "stretch",
    p: "0",
    bg: "transparent",
    borderWidth: "0",
    outline: "none",
    fontFamily: "sans",
    fontSize: "md",
    appearance: "none",
    _disabled: { cursor: "not-allowed" },
    // iOS Safari は 16px 未満の入力欄にフォーカスすると画面を拡大する
    _touch: { fontSize: "lg" },
    "&::-webkit-search-cancel-button": { display: "none" },
    "&::-webkit-search-decoration": { display: "none" },
  },
  variants: {
    surface: {
      plain: { color: "text.default", _placeholder: { color: "text.subtle" } },
      raised: {
        fontSize: "lg",
        color: "text.default",
        _placeholder: { color: "text.subtle" },
      },
    },
  },
  defaultVariants: { surface: "plain" },
});

const submitRecipe = cva({
  base: {
    display: "grid",
    placeItems: "center",
    flexShrink: "0",
    p: "0",
    borderWidth: "0",
    borderRadius: "pill",
    color: "text.inverse",
    cursor: "pointer",
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary.700",
      outlineOffset: "0.5",
    },
    _disabled: { opacity: "disabled", cursor: "not-allowed" },
  },
  variants: {
    surface: {
      plain: { w: "8", h: "8", mr: "-1", bg: "primary.700" },
      raised: {
        w: "10",
        h: "10",
        bg: "primary.700",
        transitionProperty: "[transform]",
        transitionDuration: "fast",
        transitionTimingFunction: "out",
        _active: { transform: "scale(0.94)" },
        "@media (hover: hover) and (pointer: fine)": { _hover: { bg: "primary.800" } },
        tab: { w: "12", h: "12" },
      },
    },
  },
  defaultVariants: { surface: "plain" },
});

type SearchInputProps = {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder: string;
  "aria-label": string;
  /** 渡すと右端に送信ボタンを置き、この文言を読み上げ名にする。囲むフォームを送信する。 */
  submitLabel?: string;
  size?: "md" | "lg";
  /** raised は色のついた地の上に浮かせる白い面（ホームの検索の節）。 */
  surface?: "plain" | "raised";
  maxLength?: number;
  disabled?: boolean;
  className?: string;
};

export function SearchInput({
  name,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  "aria-label": ariaLabel,
  submitLabel,
  size,
  surface = "plain",
  maxLength,
  disabled,
  className,
}: SearchInputProps) {
  return (
    <div className={cx(searchBoxRecipe({ size, surface }), className)}>
      <Icon name="search" size={surface === "raised" ? "lg" : "sm"} />
      <BaseInput
        aria-label={ariaLabel}
        autoComplete="off"
        className={searchFieldRecipe({ surface })}
        defaultValue={defaultValue}
        disabled={disabled}
        enterKeyHint="search"
        maxLength={maxLength}
        name={name}
        onValueChange={onValueChange}
        placeholder={placeholder}
        type="search"
        value={value}
      />
      {submitLabel === undefined ? null : (
        <button
          aria-label={submitLabel}
          className={submitRecipe({ surface })}
          disabled={disabled}
          type="submit"
        >
          <Icon name="arrow_forward" size={surface === "raised" ? "md" : "sm"} />
        </button>
      )}
    </div>
  );
}
