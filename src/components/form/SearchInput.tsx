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
      glass: {
        gap: "2.5",
        px: "4",
        bg: "scrim/24",
        backdropFilter: "[blur(3px)]",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "text.inverse/35",
        borderRadius: "pill",
        boxShadow: "shadow.glass",
        color: "text.inverse/90",
        "&:has(input:focus-visible)": {
          outlineWidth: "2px",
          outlineStyle: "solid",
          outlineColor: "text.inverse",
          outlineOffset: "[3px]",
        },
        tab: { minH: "16", px: "6" },
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
      glass: {
        fontSize: "lg",
        fontWeight: "bold",
        color: "text.inverse",
        caretColor: "text.inverse",
        _placeholder: { color: "text.inverse/90", fontWeight: "medium" },
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
      glass: {
        w: "9",
        h: "9",
        bg: "primary.600/72",
        backdropFilter: "[blur(3px)]",
        tab: { w: "11", h: "11" },
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
  /** glass は写真の上に置く暗い透過の面（ホームのヒーロー）。 */
  surface?: "plain" | "glass";
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
      <Icon name="search" size={surface === "glass" ? "md" : "sm"} />
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
          <Icon name="arrow_forward" size="sm" />
        </button>
      )}
    </div>
  );
}
