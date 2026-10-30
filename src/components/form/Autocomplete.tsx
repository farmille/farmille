"use client";

import { Autocomplete as BaseAutocomplete } from "@base-ui/react/autocomplete";
import { useRef, useReducer, type ReactNode, type Ref } from "react";

import { Icon } from "@/components/Icon";
import { optionRecipe, popupPositionerStyle, popupRecipe } from "@/components/popup";
import { cx } from "../../../styled-system/css";
import { emptyStyle, isComposingEnter, optionName, OptionText } from "./Combobox";
import { useFieldRequired } from "./field-context";
import { Labeled, splitLabeling, type Labeling } from "./Labeled";
import { controlRecipe } from "./recipes";
import { searchBoxRecipe, searchFieldRecipe } from "./SearchInput";
import type { Option } from "./types";

type AutocompleteBodyProps = {
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
  size?: "md" | "sm" | "search";
  placeholder?: string;
  /** 候補が0件のときの案内。省くと0件のあいだ一覧を出さない。 */
  emptyMessage?: string;
  name?: string;
  maxLength?: number;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  inputRef?: Ref<HTMLInputElement>;
  className?: string;
};

type AutocompleteProps = AutocompleteBodyProps & Labeling;

const labelOf = (option: Option) => option.label;

export function Autocomplete(props: AutocompleteProps) {
  const [labeling] = splitLabeling(props);
  return (
    <Labeled disabled={props.disabled} labeling={labeling} name={props.name}>
      {props.open === undefined ? (
        <UncontrolledAutocomplete {...props} />
      ) : (
        <AutocompleteBody {...props} open={props.open} />
      )}
    </Labeled>
  );
}

function UncontrolledAutocomplete(props: AutocompleteBodyProps) {
  const [open, setOpen] = useReducer((_current: boolean, next: boolean) => next, false);
  return (
    <AutocompleteBody
      {...props}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        props.onOpenChange?.(next);
      }}
    />
  );
}

function AutocompleteBody({
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
  className,
}: AutocompleteBodyProps & { open: boolean }) {
  const required = useFieldRequired();
  const highlighted = useRef(false);
  const filter = BaseAutocomplete.useFilter();
  const query = value.trim();
  const visible =
    filterMode === "preFiltered" || query === ""
      ? options
      : options.filter((option) => filter.contains(option, query, labelOf));
  // 候補も案内も無い一覧は開かない。開いたままだと Base UI が周りを読み上げから隠し、aria-expanded も true のまま残る
  const shown = open && (visible.length > 0 || emptyMessage !== undefined);

  const input = (
    <BaseAutocomplete.Input
      className={size === "search" ? searchFieldRecipe() : cx(controlRecipe({ size }), className)}
      maxLength={maxLength}
      onBlur={() => {
        if (shown) return;
        onOpenChange?.(false);
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" || isComposingEnter(event)) return;
        if (highlighted.current || onSubmitText === undefined) return;
        event.preventDefault();
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
        if (details.reason !== "item-press") onValueChange(next);
      }}
      onOpenChange={onOpenChange}
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
          <BaseAutocomplete.Popup className={popupRecipe({ motion: "none" })}>
            <BaseAutocomplete.Empty className={emptyStyle}>{emptyMessage}</BaseAutocomplete.Empty>
            <BaseAutocomplete.List>
              {(option: Option) => (
                <BaseAutocomplete.Item
                  aria-label={optionName(option)}
                  className={optionRecipe()}
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
