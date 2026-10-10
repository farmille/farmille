"use client";

import { Autocomplete as BaseAutocomplete } from "@base-ui/react/autocomplete";
import { useRef, useState, type ReactNode, type Ref } from "react";

import { Icon } from "@/components/Icon";
import { popupPositionerStyle, popupRecipe } from "@/components/popup";
import { cx } from "../../../styled-system/css";
import { emptyStyle, isComposingEnter, optionItemStyle, optionName, OptionText } from "./Combobox";
import { useFieldRequired } from "./field-context";
import { controlRecipe } from "./recipes";
import { searchBoxRecipe, searchFieldRecipe } from "./SearchInput";
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
  /** 一覧の開閉を呼び出し側が持つとき（ボタンで検索して結果を出すなど）に渡す。 */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  inputRef?: Ref<HTMLInputElement>;
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
  open,
  onOpenChange,
  inputRef,
  "aria-label": ariaLabel,
  className,
}: AutocompleteProps) {
  const required = useFieldRequired();
  const highlighted = useRef(false);
  const filter = BaseAutocomplete.useFilter();
  const [requestedOpen, setRequestedOpen] = useState(false);
  const query = value.trim();
  const visible =
    filterMode === "preFiltered" || query === ""
      ? options
      : options.filter((option) => filter.contains(option, query, labelOf));
  // 候補も案内も無い一覧は開かない。開いたままだと Base UI が周りを読み上げから隠し、aria-expanded も true のまま残る
  const shown = (open ?? requestedOpen) && (visible.length > 0 || emptyMessage !== undefined);

  const input = (
    <BaseAutocomplete.Input
      aria-label={ariaLabel}
      className={size === "search" ? searchFieldRecipe() : cx(controlRecipe({ size }), className)}
      maxLength={maxLength}
      // 一覧を出していないあいだに入力欄を離れたら、開く要求も取り下げる（後から候補が増えても勝手に開かない）
      onBlur={() => {
        if (shown) return;
        setRequestedOpen(false);
        onOpenChange?.(false);
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" || isComposingEnter(event)) return;
        // 候補を選んだ状態の Enter は Base UI が候補の選択として扱う
        if (highlighted.current || onSubmitText === undefined) return;
        event.preventDefault();
        // 入力した文字で確定したので、候補の一覧は閉じる
        setRequestedOpen(false);
        onOpenChange?.(false);
        onSubmitText(value);
      }}
      placeholder={placeholder}
      ref={inputRef}
      type={size === "search" ? "search" : "text"}
    />
  );

  return (
    <BaseAutocomplete.Root
      disabled={disabled}
      filter={null}
      itemToStringValue={labelOf}
      items={visible}
      name={name}
      onItemHighlighted={(option) => {
        highlighted.current = option !== undefined;
      }}
      onValueChange={(next, details) => {
        // 候補を選ぶと Base UI は入力欄を候補のラベルで埋める。文字をどうするかは onPick に任せる
        if (details.reason !== "item-press") onValueChange(next);
      }}
      onOpenChange={(next) => {
        setRequestedOpen(next);
        onOpenChange?.(next);
      }}
      open={shown}
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
          <BaseAutocomplete.Popup className={popupRecipe({ motion: "none" })}>
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
