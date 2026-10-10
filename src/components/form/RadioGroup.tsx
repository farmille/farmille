"use client";

import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";

import { cx } from "../../../styled-system/css";
import { Choice, EnsureFieldRoot } from "./Field";
import { useFieldContext, useResetKey } from "./field-context";
import { choiceGroupRecipe, radioDotStyle } from "./recipes";
import type { Option } from "./types";

type RadioGroupProps<V extends string> = {
  options: readonly Option<V>[];
  variant?: "list" | "cards";
  value?: V;
  defaultValue?: V;
  onValueChange?: (value: V) => void;
  name?: string;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
};

export function RadioGroup<V extends string>({
  options,
  variant = "list",
  value,
  defaultValue,
  onValueChange,
  name,
  disabled,
  "aria-label": ariaLabel,
  className,
}: RadioGroupProps<V>) {
  const { required, inRoot } = useFieldContext();
  const resetKey = useResetKey(defaultValue ?? "");
  const group = (
    <BaseRadioGroup<V>
      key={resetKey}
      aria-label={ariaLabel}
      className={cx(choiceGroupRecipe({ variant }), inRoot ? className : undefined)}
      defaultValue={defaultValue}
      disabled={disabled}
      name={name}
      onValueChange={onValueChange}
      required={required}
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
