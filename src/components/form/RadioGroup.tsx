"use client";

import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";

import { cx } from "../../../styled-system/css";
import { Choice, EnsureFieldRoot } from "./Field";
import { useFieldContext, useResetKey } from "./field-context";
import { Labeled, splitLabeling, type Labeling } from "./Labeled";
import { restoredChoices, useRestoredField } from "./persisted-input";
import { choiceGroupRecipe, radioDotStyle } from "./recipes";
import type { Option } from "./types";

type RadioGroupBodyProps<V extends string> = {
  options: readonly Option<V>[];
  variant?: "list" | "cards";
  value?: V;
  defaultValue?: V;
  onValueChange?: (value: V) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
};

type RadioGroupProps<V extends string> = RadioGroupBodyProps<V> & Labeling;

export function RadioGroup<V extends string>(props: RadioGroupProps<V>) {
  const [labeling] = splitLabeling(props);
  return (
    <Labeled disabled={props.disabled} kind="group" labeling={labeling} name={props.name}>
      <RadioGroupBody<V> {...props} />
    </Labeled>
  );
}

function RadioGroupBody<V extends string>({
  options,
  variant = "list",
  value,
  defaultValue,
  onValueChange,
  name,
  disabled,
  className,
}: RadioGroupBodyProps<V>) {
  const field = useFieldContext();
  const restored = useRestoredField(name ?? field.name);
  const initial =
    value === undefined && restored !== undefined
      ? (restoredChoices(options, restored)[0] ?? defaultValue)
      : defaultValue;
  const resetKey = useResetKey(initial ?? "");
  const group = (
    <BaseRadioGroup<V>
      key={resetKey}
      className={cx(choiceGroupRecipe({ variant }), field.inRoot ? className : undefined)}
      defaultValue={initial}
      disabled={disabled}
      name={name}
      onValueChange={onValueChange}
      required={field.required}
      value={value}
    >
      {options.map((option) => (
        <Choice
          description={option.description}
          disabled={option.disabled}
          key={option.value}
          label={option.label}
          look={variant === "cards" ? "card" : "inline"}
        >
          {(frame) => (
            <BaseRadio.Root
              className={radioDotStyle}
              nativeButton
              render={frame}
              value={option.value}
            />
          )}
        </Choice>
      ))}
    </BaseRadioGroup>
  );

  return (
    <EnsureFieldRoot className={className} disabled={disabled} name={name}>
      {group}
    </EnsureFieldRoot>
  );
}
