"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { CheckboxGroup as BaseCheckboxGroup } from "@base-ui/react/checkbox-group";
import { useMemo, useState } from "react";

import { Icon } from "@/components/Icon";
import { cx } from "../../../styled-system/css";
import { Choice, EnsureFieldRoot } from "./Field";
import { useFieldContext, useResetKey } from "./field-context";
import { Labeled, splitLabeling, type Labeling } from "./Labeled";
import { restoredChoices, useRestoredField } from "./persisted-input";
import { checkboxBoxRecipe, checkIndicatorStyle, choiceGroupRecipe } from "./recipes";
import type { Option } from "./types";

type CheckboxGroupBodyProps<V extends string> = {
  options: readonly Option<V>[];
  variant?: "list" | "chips";
  value?: readonly V[];
  defaultValue?: readonly V[];
  onValueChange?: (value: V[]) => void;
  /** 選べる数の上限。上限に達すると、選んでいない選択肢を押せなくする。 */
  limit?: number;
  name?: string;
  disabled?: boolean;
  className?: string;
};

type CheckboxGroupProps<V extends string> = CheckboxGroupBodyProps<V> & Labeling;

export function CheckboxGroup<V extends string>(props: CheckboxGroupProps<V>) {
  const [labeling] = splitLabeling(props);
  return (
    <Labeled disabled={props.disabled} kind="group" labeling={labeling} name={props.name}>
      <CheckboxGroupWithReset<V> {...props} />
    </Labeled>
  );
}

function CheckboxGroupWithReset<V extends string>(props: CheckboxGroupBodyProps<V>) {
  const field = useFieldContext();
  const restored = useRestoredField(props.name ?? field.name);
  const initial =
    props.value === undefined && restored !== undefined
      ? restoredChoices(props.options, restored)
      : props.defaultValue;
  const resetKey = useResetKey((initial ?? []).join("\u001f"));
  return <CheckboxGroupBody<V> key={resetKey} {...props} defaultValue={initial} />;
}

function CheckboxGroupBody<V extends string>({
  options,
  variant = "list",
  value,
  defaultValue,
  onValueChange,
  limit,
  name,
  disabled,
  className,
}: CheckboxGroupBodyProps<V>) {
  const { inRoot } = useFieldContext();
  const [uncontrolled, setUncontrolled] = useState<readonly V[]>(defaultValue ?? []);
  const current = value ?? uncontrolled;
  // Base UI は value の参照が変わるたびに Form のエラーを消す
  const groupValue = useMemo(() => [...current], [current]);
  const full = limit !== undefined && current.length >= limit;

  function handleValueChange(next: readonly string[]): void {
    const picked = options
      .filter((option) => next.includes(option.value))
      .map((option) => option.value);
    setUncontrolled(picked);
    onValueChange?.(picked);
  }

  const group = (
    <BaseCheckboxGroup
      className={cx(choiceGroupRecipe({ variant }), inRoot ? className : undefined)}
      disabled={disabled}
      onValueChange={handleValueChange}
      value={groupValue}
    >
      {options.map((option) => (
        <Choice
          description={option.description}
          disabled={option.disabled === true || (full && !current.includes(option.value))}
          key={option.value}
          label={option.label}
          look={variant === "chips" ? "chip" : "inline"}
        >
          {(frame) => (
            <BaseCheckbox.Root
              className={checkboxBoxRecipe({ look: variant === "chips" ? "hidden" : "box" })}
              name={name}
              nativeButton
              render={frame}
              value={option.value}
            >
              <BaseCheckbox.Indicator className={checkIndicatorStyle}>
                <Icon name="check" size="xs" />
              </BaseCheckbox.Indicator>
            </BaseCheckbox.Root>
          )}
        </Choice>
      ))}
    </BaseCheckboxGroup>
  );

  return (
    <EnsureFieldRoot className={className} disabled={disabled} name={name}>
      {group}
    </EnsureFieldRoot>
  );
}
