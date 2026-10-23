"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { useLayoutEffect, useRef, type ComponentPropsWithRef } from "react";

import { cx } from "../../../styled-system/css";
import { useFieldContext } from "./field-context";
import { Labeled, splitLabeling, type Labeling } from "./Labeled";
import { useRestoredText } from "./persisted-input";
import { textareaExampleStyle, textareaRecipe } from "./recipes";

type TextareaBodyProps = Omit<
  ComponentPropsWithRef<"textarea">,
  "required" | "aria-invalid" | "placeholder"
> & {
  /** document は文書に書き込む枠なしの欄。1行から始まり、書いた分だけ伸びる。 */
  size?: "md" | "lg" | "document";
  placeholder?: string;
  /**
   * 記入例。欄の placeholder の代わりに欄の下へ常に出し、書き始めても消さずに1行下へずらす。
   * 改行で区切ると、1行目を案内、2行目以降を例として読める。
   */
  example?: string;
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
  example,
  placeholder,
  "aria-describedby": describedBy,
  ...textareaProps
}: TextareaBodyProps) {
  const field = useFieldContext();
  const restored = useRestoredText(name ?? field.name);
  const ref = useRef<HTMLTextAreaElement>(null);
  const grows = size === "document";
  useLayoutEffect(() => {
    const element = ref.current;
    if (!grows || element === null) return;
    const fit = () => {
      element.style.height = "0";
      element.style.height = `${element.scrollHeight}px`;
    };
    fit();
    element.addEventListener("input", fit);
    window.addEventListener("resize", fit);
    return () => {
      element.removeEventListener("input", fit);
      window.removeEventListener("resize", fit);
    };
  }, [grows, value]);
  // 記入例があるときは placeholder を空白1文字にして、:placeholder-shown で「空かどうか」を CSS から読む
  const control = (
    <BaseField.Control
      aria-describedby={describedBy}
      className={cx(textareaRecipe({ size }), className)}
      defaultValue={value === undefined ? (restored ?? defaultValue) : defaultValue}
      disabled={disabled}
      id={id}
      name={name}
      render={
        <textarea
          {...textareaProps}
          ref={ref}
          rows={grows ? 1 : textareaProps.rows}
          placeholder={example === undefined ? placeholder : " "}
          aria-description={example}
        />
      }
      required={field.required}
      value={value}
    />
  );
  if (example === undefined) return control;
  return (
    <>
      {control}
      <p className={textareaExampleStyle} aria-hidden="true">
        {example}
      </p>
    </>
  );
}
