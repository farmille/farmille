"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import { useId, type ReactNode } from "react";

import { cx } from "../../../styled-system/css";
import { FieldErrorText, LabelRow, VisibilityText, type FieldProps } from "./Field";
import { FieldContext, useFieldContext } from "./field-context";
import { fieldStyle, fieldsetStyle, guideRecipe, visibilityRecipe } from "./recipes";

export type FieldsetProps = Omit<FieldProps, "label" | "hideLabel" | "labelSize"> & {
  legend: ReactNode;
  labelSize?: "md" | "sm";
};

/**
 * 複数の入力や、ラジオ・チェックボックスの組をまとめる見出し付きの枠。
 * name か error があるときだけ Field.Root で包み、組の送信名とエラーを持つ。
 * name が無ければ、中の Field がそれぞれ自分の name とエラーを持つ（本名＝姓＋名など）。
 */
export function Fieldset({
  legend,
  labelSize = "md",
  name,
  requirement,
  visibility,
  lead,
  description,
  error,
  disabled,
  className,
  children,
}: FieldsetProps) {
  const parent = useFieldContext();
  const required = requirement === undefined ? parent.required : requirement === "required";
  const rooted = name !== undefined || error !== undefined;
  const id = useId();
  // 案内は組の中の入力ではなく fieldset そのものの説明として読ませる
  const describedBy = [
    visibility === undefined ? null : `${id}-visibility`,
    lead === undefined ? null : `${id}-lead`,
    description === undefined ? null : `${id}-description`,
  ]
    .filter((part) => part !== null)
    .join(" ");

  const fieldset = (
    <BaseFieldset.Root
      aria-describedby={describedBy === "" ? undefined : describedBy}
      className={rooted ? fieldsetStyle : cx(fieldStyle, className)}
      disabled={disabled}
    >
      <LabelRow
        requirement={requirement}
        size={labelSize}
        visibility={
          visibility === undefined ? null : (
            <p className={visibilityRecipe({ visibility })} id={`${id}-visibility`}>
              <VisibilityText visibility={visibility} />
            </p>
          )
        }
      >
        <BaseFieldset.Legend>{legend}</BaseFieldset.Legend>
      </LabelRow>
      {lead === undefined ? null : (
        <p className={guideRecipe({ placement: "above" })} id={`${id}-lead`}>
          {lead}
        </p>
      )}
      <FieldContext.Provider value={{ required, inRoot: rooted }}>{children}</FieldContext.Provider>
      {description === undefined ? null : (
        <p className={guideRecipe({ placement: "below" })} id={`${id}-description`}>
          {description}
        </p>
      )}
      {rooted ? <FieldErrorText error={error} /> : null}
    </BaseFieldset.Root>
  );

  return rooted ? (
    <BaseField.Root
      className={cx(fieldStyle, className)}
      disabled={disabled}
      invalid={error !== undefined}
      name={name}
    >
      {fieldset}
    </BaseField.Root>
  ) : (
    fieldset
  );
}
