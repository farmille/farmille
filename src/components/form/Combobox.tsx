"use client";

import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import type { BaseUIEvent } from "@base-ui/react/types";
import { useMemo, useRef, useState, type KeyboardEvent } from "react";

import { chipRecipe } from "@/components/Chip";
import { Icon } from "@/components/Icon";
import {
  optionDescriptionStyle,
  optionRecipe,
  popupPositionerStyle,
  popupRecipe,
} from "@/components/popup";
import { css, cx } from "../../../styled-system/css";
import { useFieldRequired } from "./field-context";
import { Labeled, splitLabeling, type Labeling } from "./Labeled";
import type { Option } from "./types";

const optionLabelStyle = css({ flex: "1", minW: "0" });

const optionDetailStyle = css({ flexShrink: "0", textAlign: "end" });

/** Base UI の Empty は読み上げのため隠さずに置く。候補があるあいだは中身が空になるので、余白だけを消す。 */
export const emptyStyle = css({
  px: "3",
  py: "2.5",
  textStyle: "supporting",
  color: "text.subtle",
  "&:empty": { p: "0" },
});

/** 候補の読み上げ名は「ラベル 説明」。説明の無い候補は表示中の文字がそのまま名前になる。 */
export function optionName(option: Option): string | undefined {
  return option.description === undefined ? undefined : `${option.label} ${option.description}`;
}

export function OptionText({ option }: { option: Option }) {
  return (
    <>
      <span className={optionLabelStyle}>{option.label}</span>
      {option.description === undefined ? null : (
        <span className={cx(optionDescriptionStyle, optionDetailStyle)}>{option.description}</span>
      )}
    </>
  );
}

/** Base UI は keyCode 229 しか見ないので、isComposing の Enter も Base UI に渡さない。 */
export function isComposingEnter(event: BaseUIEvent<KeyboardEvent<HTMLInputElement>>): boolean {
  if (!event.nativeEvent.isComposing && event.keyCode !== 229) return false;
  event.preventBaseUIHandler();
  return true;
}

const groupStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  w: "100%",
  px: "3",
  py: "1",
  bg: "surface.card",
  color: "text.default",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.strong",
  borderRadius: "input",
  cursor: "text",
  _focusWithin: {
    outlineWidth: "1px",
    outlineStyle: "solid",
    outlineColor: "primary.200",
    borderColor: "primary.600",
  },
  _fieldInvalid: { borderColor: "accent.danger" },
  _disabled: { opacity: "disabled", cursor: "not-allowed" },
});

const inputStyle = css({
  flex: "1",
  minW: "12",
  py: "1.5",
  bg: "transparent",
  borderWidth: "0",
  outline: "none",
  color: "inherit",
  fontFamily: "sans",
  fontSize: "md",
  _placeholder: { color: "text.subtle" },
  _disabled: { cursor: "not-allowed" },
  // iOS Safari は 16px 未満の入力欄にフォーカスすると画面を拡大する
  _touch: { fontSize: "lg" },
});

const chipsStyle = css({
  display: "flex",
  flex: "1",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "1.5",
  minW: "0",
});

const iconStyle = css({ display: "flex", flexShrink: "0", color: "text.subtle" });

const checkStyle = css({ display: "flex", flexShrink: "0", color: "primary.700" });

type ComboboxCommonProps = {
  options: readonly Option[];
  /** contains は入力した文字をラベルに含む候補だけを出す。preFiltered は options をそのまま出す（呼び出し側が絞る）。 */
  filterMode?: "contains" | "preFiltered";
  inputValue?: string;
  onInputValueChange?: (value: string) => void;
  placeholder?: string;
  emptyMessage: string;
  name?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * 値は候補そのもの（Option）で持つ。サーバー検索で options が入れ替わっても、
 * 選んだ候補のラベルと送信値を失わない。
 */
type SingleProps = {
  multiple?: false;
  value?: Option | null;
  defaultValue?: Option | null;
  onValueChange?: (value: Option | null) => void;
  max?: undefined;
};

type MultipleProps = {
  multiple: true;
  value?: readonly Option[];
  defaultValue?: readonly Option[];
  onValueChange?: (value: Option[]) => void;
  /** 選べる数の上限。達すると入力欄を読み取り専用にし、選んでいない候補を押せなくする（チップは外せる）。 */
  max?: number;
};

type ComboboxProps = ComboboxCommonProps & (SingleProps | MultipleProps) & Labeling;

const sameOption = (item: Option, value: Option) => item.value === value.value;
const labelOf = (option: Option) => option.label;
const valueOf = (option: Option) => option.value;

/**
 * 決まった候補から選ぶ入力欄。multiple では選んだ候補を入力欄の中のチップで示す。
 * name（または囲む Field の name）があると、選んだ値ごとに送信値を持つ。
 */
export function Combobox(props: ComboboxProps) {
  const [labeling] = splitLabeling(props);
  return (
    <Labeled disabled={props.disabled} labeling={labeling} name={props.name}>
      {props.multiple === true ? <MultipleCombobox {...props} /> : <SingleCombobox {...props} />}
    </Labeled>
  );
}

function SingleCombobox({
  options,
  filterMode = "contains",
  inputValue,
  onInputValueChange,
  placeholder,
  emptyMessage,
  name,
  disabled,
  className,
  value,
  defaultValue,
  onValueChange,
}: ComboboxCommonProps & SingleProps) {
  const required = useFieldRequired();
  const enterGuard = useEnterGuard();

  return (
    <BaseCombobox.Root<Option>
      defaultValue={defaultValue}
      disabled={disabled}
      filter={filterMode === "preFiltered" ? null : undefined}
      inputValue={inputValue}
      isItemEqualToValue={sameOption}
      itemToStringLabel={labelOf}
      itemToStringValue={valueOf}
      items={options}
      name={name}
      onInputValueChange={onInputValueChange}
      onItemHighlighted={enterGuard.onItemHighlighted}
      onValueChange={(next) => onValueChange?.(next)}
      required={required}
      value={value}
    >
      <BaseCombobox.InputGroup className={cx(groupStyle, className)}>
        <BaseCombobox.Input
          className={inputStyle}
          onKeyDown={enterGuard.onKeyDown}
          placeholder={placeholder}
        />
        <BaseCombobox.Icon className={iconStyle}>
          <Icon name="expand_more" size="sm" />
        </BaseCombobox.Icon>
      </BaseCombobox.InputGroup>
      <OptionPopup emptyMessage={emptyMessage} isDisabled={(option) => option.disabled === true} />
    </BaseCombobox.Root>
  );
}

function MultipleCombobox({
  options,
  filterMode = "contains",
  inputValue,
  onInputValueChange,
  placeholder,
  emptyMessage,
  name,
  disabled,
  className,
  value,
  defaultValue,
  onValueChange,
  max,
}: ComboboxCommonProps & MultipleProps) {
  const required = useFieldRequired();
  const enterGuard = useEnterGuard();
  const [uncontrolled, setUncontrolled] = useState<readonly Option[]>(defaultValue ?? []);
  const current = value ?? uncontrolled;
  // Base UI は値の参照が変わるたびに Form のエラーを消す
  const selected = useMemo(() => [...current], [current]);
  const full = max !== undefined && selected.length >= max;
  const chips = chipRecipe({ size: "sm", removable: true });

  return (
    <BaseCombobox.Root<Option, true>
      disabled={disabled}
      filter={filterMode === "preFiltered" ? null : undefined}
      inputValue={inputValue}
      isItemEqualToValue={sameOption}
      itemToStringLabel={labelOf}
      itemToStringValue={valueOf}
      items={options}
      multiple
      name={name}
      onInputValueChange={onInputValueChange}
      onItemHighlighted={enterGuard.onItemHighlighted}
      onValueChange={(next) => {
        setUncontrolled(next);
        onValueChange?.(next);
      }}
      required={required}
      value={selected}
    >
      <BaseCombobox.InputGroup className={cx(groupStyle, className)}>
        <BaseCombobox.Chips className={chipsStyle}>
          {selected.map((option) => (
            <BaseCombobox.Chip className={chips.root} key={option.value}>
              {option.label}
              <BaseCombobox.ChipRemove
                aria-label={`${option.label}を削除`}
                className={chips.remove}
              >
                <Icon name="close" size="2xs" />
              </BaseCombobox.ChipRemove>
            </BaseCombobox.Chip>
          ))}
          <BaseCombobox.Input
            className={inputStyle}
            onKeyDown={enterGuard.onKeyDown}
            placeholder={selected.length > 0 ? undefined : placeholder}
            readOnly={full}
          />
        </BaseCombobox.Chips>
        <BaseCombobox.Icon className={iconStyle}>
          <Icon name="expand_more" size="sm" />
        </BaseCombobox.Icon>
      </BaseCombobox.InputGroup>
      <OptionPopup
        emptyMessage={emptyMessage}
        isDisabled={(option) =>
          option.disabled === true ||
          (full && !selected.some((picked) => picked.value === option.value))
        }
      />
    </BaseCombobox.Root>
  );
}

function useEnterGuard() {
  const highlighted = useRef(false);
  return {
    onItemHighlighted: (item: Option | undefined) => {
      highlighted.current = item !== undefined;
    },
    onKeyDown: (event: BaseUIEvent<KeyboardEvent<HTMLInputElement>>) => {
      if (event.key !== "Enter" || isComposingEnter(event)) return;
      if (!highlighted.current) event.preventDefault();
    },
  };
}

function OptionPopup({
  emptyMessage,
  isDisabled,
}: {
  emptyMessage: string;
  isDisabled: (option: Option) => boolean;
}) {
  return (
    <BaseCombobox.Portal>
      <BaseCombobox.Positioner className={popupPositionerStyle} sideOffset={4}>
        <BaseCombobox.Popup className={popupRecipe({ motion: "none" })}>
          <BaseCombobox.Empty className={emptyStyle}>{emptyMessage}</BaseCombobox.Empty>
          <BaseCombobox.List>
            {(option: Option) => (
              <BaseCombobox.Item
                aria-label={optionName(option)}
                className={optionRecipe()}
                disabled={isDisabled(option)}
                key={option.value}
                value={option}
              >
                <OptionText option={option} />
                <BaseCombobox.ItemIndicator className={checkStyle}>
                  <Icon name="check" size="sm" />
                </BaseCombobox.ItemIndicator>
              </BaseCombobox.Item>
            )}
          </BaseCombobox.List>
        </BaseCombobox.Popup>
      </BaseCombobox.Positioner>
    </BaseCombobox.Portal>
  );
}
