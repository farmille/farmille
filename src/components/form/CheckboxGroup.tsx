"use client";

import { useForm, useStore } from "@tanstack/react-form";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { CheckboxGroup as BaseCheckboxGroup } from "@base-ui/react/checkbox-group";
import { useMemo } from "react";

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
      {props.value === undefined ? (
        <CheckboxGroupWithReset<V> {...props} />
      ) : (
        <CheckboxGroupBody<V> {...props} value={props.value} />
      )}
    </Labeled>
  );
}

function CheckboxGroupWithReset<V extends string>(props: CheckboxGroupBodyProps<V>) {
  const field = useFieldContext();
  const restored = useRestoredField(props.name ?? field.name);

  const initial =
    restored === undefined ? props.defaultValue : restoredChoices(props.options, restored);

  const resetKey = useResetKey((initial ?? []).join("\u001f"));

  return <UncontrolledCheckboxGroup<V> key={resetKey} {...props} defaultValue={initial} />;
}

function UncontrolledCheckboxGroup<V extends string>({
  defaultValue,
  onValueChange,
  ...props
}: CheckboxGroupBodyProps<V>) {
  const initial: string[] = [...(defaultValue ?? [])];
  const form = useForm({ defaultValues: { selection: initial } });
  const selection = useStore(form.store, (state) => state.values.selection);

  const picked = useMemo(
    () =>
      props.options
        .filter((option) => selection.includes(option.value))
        .map((option) => option.value),
    [props.options, selection],
  );

  return (
    <CheckboxGroupBody
      {...props}
      onValueChange={(next) => {
        form.setFieldValue("selection", next);
        onValueChange?.(next);
      }}
      value={picked}
    />
  );
}

function CheckboxGroupBody<V extends string>({
  options,
  variant = "list",
  value,
  onValueChange,
  limit,
  name,
  disabled,
  className,
}: CheckboxGroupBodyProps<V> & { value: readonly V[] }) {
  const { inRoot } = useFieldContext();
  // Base UI は value の参照が変わるたびに Form のエラーを消す
  const groupValue = useMemo(() => [...value], [value]);
  const full = limit !== undefined && value.length >= limit;

  function handleValueChange(next: readonly string[]): void {
    const picked = options
      .filter((option) => next.includes(option.value))
      .map((option) => option.value);

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
          disabled={option.disabled === true || (full && !value.includes(option.value))}
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
