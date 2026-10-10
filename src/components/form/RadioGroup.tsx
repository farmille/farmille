"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";

import { cx } from "../../../styled-system/css";
import { Choice } from "./Field";
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

/** 1つだけ選ぶ。矢印キーで選択肢を移る。必須かどうかは囲む Field・Fieldset で決まる。 */
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

  // Field の外では自分の Field.Root を持ち、Form の検証と errors の対象にする
  return inRoot ? (
    group
  ) : (
    <BaseField.Root className={className} disabled={disabled} name={name}>
      {group}
    </BaseField.Root>
  );
}
