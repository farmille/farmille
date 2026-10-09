"use client";

import { Autocomplete as BaseAutocomplete } from "@base-ui/react/autocomplete";
import { useRef, type ReactNode } from "react";

import { Icon } from "@/components/Icon";
import { popupPositionerStyle, popupRecipe } from "@/components/popup";
import { cx } from "../../../styled-system/css";
import {
  emptyStyle,
  isComposingEnter,
  listPopupRecipe,
  optionItemStyle,
  optionName,
  OptionText,
} from "./Combobox";
import { useFieldRequired } from "./field-context";
import { controlRecipe } from "./recipes";
import { searchBoxRecipe, searchFieldStyle } from "./SearchInput";
import type { Option } from "./types";

type AutocompleteProps = {
  /** 入力中の文字。候補を選んでも変わらない（変えるのは onPick の中で呼び出し側が決める）。 */
  value: string;
  onValueChange: (value: string) => void;
  options: readonly Option[];
  /** 候補を押したとき、または候補を選んだ状態の Enter で呼ぶ。 */
  onPick?: (option: Option) => void;
  /** 候補を選んでいない Enter で、入力中の文字を確定する。渡さないときは囲むフォームの送信に任せる。 */
  onSubmitText?: (text: string) => void;
  /** 候補の中身を描き分ける。読み上げ名は説明があれば「ラベル 説明」のまま。 */
  renderOption?: (option: Option) => ReactNode;
  /** contains は入力した文字をラベルに含む候補だけを出す。preFiltered は options をそのまま出す。 */
  filterMode?: "contains" | "preFiltered";
  /** md・sm は入力欄の見た目、search は検索欄（SearchInput）の見た目。 */
  size?: "md" | "sm" | "search";
  placeholder?: string;
  /** 候補が0件のときの案内。省くと0件のあいだ一覧を出さない。 */
  emptyMessage?: string;
  name?: string;
  maxLength?: number;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
};

const labelOf = (option: Option) => option.label;

/** 自由に入力でき、候補からも選べる入力欄。値は入力中の文字そのもの。 */
export function Autocomplete({
  value,
  onValueChange,
  options,
  onPick,
  onSubmitText,
  renderOption,
  filterMode = "contains",
  size = "md",
  placeholder,
  emptyMessage,
  name,
  maxLength,
  disabled,
  "aria-label": ariaLabel,
  className,
}: AutocompleteProps) {
  const required = useFieldRequired();
  const highlighted = useRef(false);

  const input = (
    <BaseAutocomplete.Input
      aria-label={ariaLabel}
      className={size === "search" ? searchFieldStyle : cx(controlRecipe({ size }), className)}
      maxLength={maxLength}
      onKeyDown={(event) => {
        if (event.key !== "Enter" || isComposingEnter(event)) return;
        // 候補を選んだ状態の Enter は Base UI が候補の選択として扱う
        if (highlighted.current || onSubmitText === undefined) return;
        event.preventDefault();
        onSubmitText(value);
      }}
      placeholder={placeholder}
      type={size === "search" ? "search" : "text"}
    />
  );

  return (
    <BaseAutocomplete.Root
      disabled={disabled}
      filter={filterMode === "preFiltered" ? null : undefined}
      itemToStringValue={labelOf}
      items={options}
      name={name}
      onItemHighlighted={(option) => {
        highlighted.current = option !== undefined;
      }}
      onValueChange={(next, details) => {
        // 候補を選ぶと Base UI は入力欄を候補のラベルで埋める。文字をどうするかは onPick に任せる
        if (details.reason !== "item-press") onValueChange(next);
      }}
      required={required}
      value={value}
    >
      {size === "search" ? (
        <BaseAutocomplete.InputGroup className={cx(searchBoxRecipe({ size: "lg" }), className)}>
          <Icon name="search" size="sm" />
          {input}
        </BaseAutocomplete.InputGroup>
      ) : (
        input
      )}
      <BaseAutocomplete.Portal>
        <BaseAutocomplete.Positioner className={popupPositionerStyle} sideOffset={4}>
          {/* 打鍵ごとに描き直す一覧なので動かさない */}
          <BaseAutocomplete.Popup
            className={cx(
              popupRecipe({ motion: "none" }),
              listPopupRecipe({ whenEmpty: emptyMessage === undefined ? "hide" : "show" }),
            )}
          >
            <BaseAutocomplete.Empty className={emptyStyle}>{emptyMessage}</BaseAutocomplete.Empty>
            <BaseAutocomplete.List>
              {(option: Option) => (
                <BaseAutocomplete.Item
                  aria-label={optionName(option)}
                  className={optionItemStyle}
                  disabled={option.disabled}
                  key={option.value}
                  onClick={() => onPick?.(option)}
                  value={option}
                >
                  {renderOption === undefined ? (
                    <OptionText option={option} />
                  ) : (
                    renderOption(option)
                  )}
                </BaseAutocomplete.Item>
              )}
            </BaseAutocomplete.List>
          </BaseAutocomplete.Popup>
        </BaseAutocomplete.Positioner>
      </BaseAutocomplete.Portal>
    </BaseAutocomplete.Root>
  );
}
