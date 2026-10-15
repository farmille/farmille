"use client";

import { Field as BaseField } from "@base-ui/react/field";
import type { ComponentPropsWithRef } from "react";

import { cx } from "../../../styled-system/css";
import { useFieldContext } from "./field-context";
import { Labeled, splitLabeling, type Labeling } from "./Labeled";
import { useRestoredText } from "./persisted-input";
import { textareaRecipe } from "./recipes";

type TextareaBodyProps = Omit<ComponentPropsWithRef<"textarea">, "required" | "aria-invalid"> & {
  size?: "md" | "lg";
};

type TextareaProps = TextareaBodyProps & Labeling;

export function Textarea(props: TextareaProps) {
  const [labeling, textareaProps] = splitLabeling(props);
  return (
    <Labeled disabled={textareaProps.disabled} labeling={labeling} name={textareaProps.name}>
      <TextareaBody {...textareaProps} />
    </Labeled>
  );
}

function TextareaBody({
  size,
  className,
  value,
  defaultValue,
  id,
  name,
  disabled,
  "aria-describedby": describedBy,
  ...textareaProps
}: TextareaBodyProps) {
  const field = useFieldContext();
  const restored = useRestoredText(name ?? field.name);
  // Field.Control は input 用の型なので、値と結びつけに使う属性だけを渡し、残りは textarea に付ける
  return (
    <BaseField.Control
      aria-describedby={describedBy}
      className={cx(textareaRecipe({ size }), className)}
      defaultValue={value === undefined ? (restored ?? defaultValue) : defaultValue}
      disabled={disabled}
      id={id}
      name={name}
      render={<textarea {...textareaProps} />}
      required={field.required}
      value={value}
    />
  );
}
