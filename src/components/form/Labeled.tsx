"use client";

import type { ReactNode } from "react";

import { Field, type FieldProps } from "./Field";
import { Fieldset } from "./Fieldset";
import { useFieldContext } from "./field-context";

type Chrome = Pick<
  FieldProps,
  "hideLabel" | "labelSize" | "requirement" | "visibility" | "lead" | "description" | "error"
> & {
  /** ラベルを含む枠（Field）の className。部品本体の className は部品自身の className に渡す。 */
  fieldClassName?: string;
};

type WithLabel = { label: Exclude<ReactNode, null | undefined | boolean> } & Chrome;

type WithoutLabel = { label: null } & { [K in keyof Chrome]?: never };

/**
 * 入力部品が自分のラベルと周りの案内を持つための props。
 * label を省略できないので、名前の無い入力欄は型で作れない。
 * `label={null}` は、囲む Field（または name 付きの Fieldset）がラベルを持つときだけ使う。
 */
export type Labeling = WithLabel | WithoutLabel;

type LabelingFields = { label: ReactNode } & Chrome;

export function splitLabeling<P extends LabelingFields>(
  props: P,
): [LabelingFields, Omit<P, keyof LabelingFields>] {
  const {
    label,
    hideLabel,
    labelSize,
    requirement,
    visibility,
    lead,
    description,
    error,
    fieldClassName,
    ...rest
  } = props;
  return [
    {
      label,
      hideLabel,
      labelSize,
      requirement,
      visibility,
      lead,
      description,
      error,
      fieldClassName,
    },
    rest,
  ];
}

type LabeledProps = {
  labeling: LabelingFields;
  /** field は1つの入力欄、group はチェック・ラジオの選択肢の組（見出しを legend にする）。 */
  kind?: "field" | "group";
  name?: string;
  disabled?: boolean;
  typeMismatchMessage?: string;
  children: ReactNode;
};

/** 入力部品の本体を、ラベルと案内を持つ Field（組なら Fieldset）で包む。 */
export function Labeled({
  labeling,
  kind = "field",
  name,
  disabled,
  typeMismatchMessage,
  children,
}: LabeledProps) {
  const { inRoot, inField } = useFieldContext();
  const { label, hideLabel, fieldClassName, ...chrome } = labeling;

  if (label === null) {
    if (!inRoot) {
      throw new Error("label={null} は、囲む Field か name 付きの Fieldset の中でだけ使えます。");
    }
    return children;
  }
  if (inField) {
    throw new Error("Field の中の部品に label は付けられません。Field の label を使ってください。");
  }

  return kind === "group" ? (
    <Fieldset
      {...chrome}
      className={fieldClassName}
      disabled={disabled}
      hideLegend={hideLabel}
      legend={label}
      name={name}
    >
      {children}
    </Fieldset>
  ) : (
    <Field
      {...chrome}
      className={fieldClassName}
      disabled={disabled}
      hideLabel={hideLabel}
      label={label}
      name={name}
      typeMismatchMessage={typeMismatchMessage}
    >
      {children}
    </Field>
  );
}
