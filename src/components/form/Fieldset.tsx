"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import { useId, type ReactNode } from "react";

import { cx } from "../../../styled-system/css";
import { FieldErrorText, LabelRow, VisibilityText, type FieldProps } from "./Field";
import { FieldContext, useFieldContext } from "./field-context";
import {
  fieldErrorStyle,
  fieldRecipe,
  fieldsetStyle,
  guideRecipe,
  visibilityRecipe,
} from "./recipes";

export type FieldsetProps = Omit<FieldProps, "label" | "hideLabel" | "labelSize"> & {
  legend: ReactNode;
  /** 見出しと札を画面から隠し、組の名前として読み上げにだけ残す（見出しを外側のカードが持つ同意欄など）。 */
  hideLegend?: boolean;
  labelSize?: "md" | "sm";
};

export function Fieldset({
  legend,
  hideLegend = false,
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
  const rooted = name !== undefined;
  const id = useId();
  const describedBy = [
    visibility === undefined ? null : `${id}-visibility`,
    lead === undefined ? null : `${id}-lead`,
    description === undefined ? null : `${id}-description`,
    rooted || error === undefined ? null : `${id}-error`,
  ]
    .filter((part) => part !== null)
    .join(" ");

  const fieldset = (
    <BaseFieldset.Root
      aria-describedby={describedBy === "" ? undefined : describedBy}
      className={rooted ? fieldsetStyle : cx(fieldRecipe(), className)}
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
        visuallyHidden={hideLegend}
      >
        <BaseFieldset.Legend>{legend}</BaseFieldset.Legend>
      </LabelRow>
      {lead === undefined ? null : (
        <p className={guideRecipe({ placement: "above" })} id={`${id}-lead`}>
          {lead}
        </p>
      )}
      <FieldContext.Provider value={{ required, inRoot: rooted, inField: false, name }}>
        {children}
      </FieldContext.Provider>
      {description === undefined ? null : (
        <p className={guideRecipe({ placement: "below" })} id={`${id}-description`}>
          {description}
        </p>
      )}
      {rooted ? (
        <FieldErrorText error={error} />
      ) : error === undefined ? null : (
        <p className={fieldErrorStyle} id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </BaseFieldset.Root>
  );

  return rooted ? (
    <BaseField.Root
      className={cx(fieldRecipe(), className)}
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
