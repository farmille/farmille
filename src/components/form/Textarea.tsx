"use client";

import { Field as BaseField } from "@base-ui/react/field";
import type { ComponentPropsWithRef } from "react";

import { cx } from "../../../styled-system/css";
import { useFieldRequired } from "./field-context";
import { textareaRecipe } from "./recipes";

type TextareaProps = Omit<ComponentPropsWithRef<"textarea">, "required" | "aria-invalid"> & {
  size?: "md" | "lg";
};

export function Textarea({
  size,
  className,
  value,
  defaultValue,
  id,
  name,
  disabled,
  "aria-describedby": describedBy,
  ...textareaProps
}: TextareaProps) {
  const required = useFieldRequired();
  // Field.Control は input 用の型なので、値と結びつけに使う属性だけを渡し、残りは textarea に付ける
  return (
    <BaseField.Control
      aria-describedby={describedBy}
      className={cx(textareaRecipe({ size }), className)}
      defaultValue={defaultValue}
      disabled={disabled}
      id={id}
      name={name}
      render={<textarea {...textareaProps} />}
      required={required}
      value={value}
    />
  );
}
