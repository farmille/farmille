"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { Fragment, type ReactNode } from "react";

import { Icon } from "@/components/Icon";
import { css, cx } from "../../../styled-system/css";
import { useFieldRequired } from "./field-context";
import { selectTriggerRecipe } from "./recipes";
import type { Option } from "./types";

// shortcut: popup.ts（F2）の popupRecipe・optionRecipe と同じ見た目をここに持つ。合流後はそちらを import する
const positionerStyle = css({ zIndex: "popup", outline: "none" });

const popupStyle = css({
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  boxShadow: "overlay",
  p: "1",
  maxH: "var(--available-height)",
  overflowY: "auto",
  minW: "var(--anchor-width)",
  transformOrigin: "var(--transform-origin)",
  outline: "none",
  transitionProperty: "opacity, transform",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  _startingStyle: { opacity: "0", transform: "scale(0.95)" },
  _endingStyle: { opacity: "0", transform: "scale(0.95)" },
  _motionReduce: { transitionProperty: "opacity" },
});

const optionStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  px: "3",
  py: "2.5",
  borderRadius: "input",
  fontSize: "sm",
  cursor: "default",
  userSelect: "none",
  outline: "none",
  _highlighted: { bg: "primary.soft", color: "primary.700" },
  _selected: { fontWeight: "bold" },
  _disabled: { opacity: "disabled", cursor: "not-allowed" },
});

const optionTextStyle = css({ display: "flex", flexDirection: "column", flex: "1", minW: "0" });

const optionDescriptionStyle = css({ fontSize: "xs", color: "text.subtle", fontWeight: "normal" });

const groupLabelStyle = css({
  px: "3",
  pt: "2.5",
  pb: "1",
  fontSize: "xs",
  fontWeight: "bold",
  color: "text.subtle",
});

const valueStyle = css({ flex: "1", minW: "0", truncate: true });

const triggerIconStyle = css({ display: "flex", color: "text.subtle" });

const checkStyle = css({ display: "flex", color: "primary.700" });

type SelectProps<V extends string> = {
  options: readonly Option<V>[];
  placeholder?: string;
  value?: V | null;
  defaultValue?: V | null;
  onValueChange?: (value: V | null) => void;
  size?: "md" | "sm";
  name?: string;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
};

/** ボタンを押して一覧から1つ選ぶ。トリガーの名前は囲む Field の見出しか aria-label。 */
export function Select<V extends string>({
  options,
  placeholder,
  value,
  defaultValue,
  onValueChange,
  size,
  name,
  disabled,
  "aria-label": ariaLabel,
  className,
}: SelectProps<V>) {
  const required = useFieldRequired();

  return (
    <BaseSelect.Root<V>
      defaultValue={defaultValue}
      disabled={disabled}
      items={options}
      name={name}
      onValueChange={onValueChange}
      required={required}
      value={value}
    >
      <BaseSelect.Trigger
        aria-label={ariaLabel}
        className={cx(selectTriggerRecipe({ size }), className)}
      >
        <BaseSelect.Value className={valueStyle} placeholder={placeholder} />
        <BaseSelect.Icon className={triggerIconStyle}>
          <Icon name="expand_more" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner
          alignItemWithTrigger={false}
          className={positionerStyle}
          sideOffset={4}
        >
          <BaseSelect.Popup className={popupStyle}>
            <BaseSelect.List>{renderOptions(options)}</BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}

/** group が続く選択肢を1つの見出しの下にまとめる。 */
function renderOptions<V extends string>(options: readonly Option<V>[]): ReactNode {
  const runs: { group?: string; options: Option<V>[] }[] = [];
  for (const option of options) {
    const last = runs.at(-1);
    if (last !== undefined && last.group === option.group) last.options.push(option);
    else runs.push({ group: option.group, options: [option] });
  }
  return runs.map((run) => {
    const items = run.options.map((option) => <SelectOption key={option.value} option={option} />);
    const key = run.options[0]?.value;
    return run.group === undefined ? (
      <Fragment key={key}>{items}</Fragment>
    ) : (
      <BaseSelect.Group key={key}>
        <BaseSelect.GroupLabel className={groupLabelStyle}>{run.group}</BaseSelect.GroupLabel>
        {items}
      </BaseSelect.Group>
    );
  });
}

function SelectOption<V extends string>({ option }: { option: Option<V> }) {
  return (
    <BaseSelect.Item
      className={optionStyle}
      disabled={option.disabled}
      label={option.label}
      value={option.value}
    >
      <span className={optionTextStyle}>
        <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
        {/* 選択肢の名前を「ラベル 説明」として読ませる */}
        {option.description === undefined ? null : (
          <>
            {" "}
            <span className={optionDescriptionStyle}>{option.description}</span>
          </>
        )}
      </span>
      <BaseSelect.ItemIndicator className={checkStyle}>
        <Icon name="check" size="sm" />
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  );
}
