"use client";

import { Input as BaseInput } from "@base-ui/react/input";

import { Icon } from "@/components/Icon";
import { css, cva, cx } from "../../../styled-system/css";

/** 枠の中に虫眼鏡と枠なしの入力欄を並べる検索欄。Autocomplete の size="search" も同じ枠を使う。 */
export const searchBoxRecipe = cva({
  base: {
    display: "flex",
    alignItems: "center",
    gap: "2",
    w: "100%",
    minW: "0",
    px: "3",
    bg: "surface.card",
    borderWidth: "1.5px",
    borderStyle: "solid",
    borderColor: "border.strong",
    borderRadius: "button",
    color: "text.subtle",
    cursor: "text",
    // 送信ボタンにフォーカスしたときは枠を光らせず、入力欄のときだけ入力欄と同じ焦点の表現にする
    "&:has(input:focus-visible)": {
      borderColor: "primary.600",
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary.200",
    },
    "&:has(input:disabled)": { opacity: "disabled", cursor: "not-allowed" },
  },
  variants: {
    size: {
      md: { minH: "11" },
      lg: { minH: "12" },
    },
  },
  defaultVariants: { size: "md" },
});

/** 検索欄の中の入力。枠は searchBoxRecipe が持つ。 */
export const searchFieldStyle = css({
  flex: "1",
  minW: "0",
  alignSelf: "stretch",
  p: "0",
  bg: "transparent",
  borderWidth: "0",
  outline: "none",
  color: "text.default",
  fontFamily: "sans",
  fontSize: "md",
  appearance: "none",
  _placeholder: { color: "text.subtle" },
  _disabled: { cursor: "not-allowed" },
  // iOS Safari は 16px 未満の入力欄にフォーカスすると画面を拡大する
  _touch: { fontSize: "lg" },
  "&::-webkit-search-cancel-button": { display: "none" },
  "&::-webkit-search-decoration": { display: "none" },
});

const submitStyle = css({
  display: "grid",
  placeItems: "center",
  flexShrink: "0",
  w: "8",
  h: "8",
  mr: "-1",
  p: "0",
  borderWidth: "0",
  borderRadius: "pill",
  bg: "primary.700",
  color: "text.inverse",
  cursor: "pointer",
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.700",
    outlineOffset: "2px",
  },
  _disabled: { opacity: "disabled", cursor: "not-allowed" },
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
  maxLength?: number;
  disabled?: boolean;
  className?: string;
};

/** 資材や記事を探す検索欄。送信は囲むフォームに任せる。 */
export function SearchInput({
  name,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  "aria-label": ariaLabel,
  submitLabel,
  size,
  maxLength,
  disabled,
  className,
}: SearchInputProps) {
  return (
    <div className={cx(searchBoxRecipe({ size }), className)}>
      <Icon name="search" size="sm" />
      <BaseInput
        aria-label={ariaLabel}
        autoComplete="off"
        className={searchFieldStyle}
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
        <button aria-label={submitLabel} className={submitStyle} disabled={disabled} type="submit">
          <Icon name="arrow_forward" size="sm" />
        </button>
      )}
    </div>
  );
}
