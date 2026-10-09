"use client";

import { Input as BaseInput } from "@base-ui/react/input";
import type { ComponentPropsWithRef } from "react";

import { cx } from "../../../styled-system/css";
import { useFieldRequired } from "./field-context";
import { controlRecipe } from "./recipes";

type InputProps = Omit<ComponentPropsWithRef<"input">, "size" | "required" | "aria-invalid"> & {
  size?: "md" | "sm";
};

/** 単行の入力欄。必須かどうかは囲む Field の requirement で決まる。 */
export function Input({ size, className, ...rest }: InputProps) {
  const required = useFieldRequired();
  return (
    <BaseInput {...rest} className={cx(controlRecipe({ size }), className)} required={required} />
  );
}
