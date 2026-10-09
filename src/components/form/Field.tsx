"use client";

import { Field as BaseField } from "@base-ui/react/field";
import type { HTMLProps } from "@base-ui/react/types";
import type { ReactElement, ReactNode } from "react";

import { Badge } from "@/components/Badge";
import { Icon } from "@/components/Icon";
import { cx } from "../../../styled-system/css";
import { FieldContext, useFieldContext } from "./field-context";
import {
  choiceDescriptionRecipe,
  choiceItemStyle,
  choiceRecipe,
  fieldErrorStyle,
  fieldRecipe,
  guideRecipe,
  labelRowRecipe,
  srOnlyStyle,
  visibilityRecipe,
} from "./recipes";
import type { Requirement, Visibility } from "./types";

export type FieldProps = {
  /** 送信名であり、Form の errors のキー。子の name より優先される。 */
  name?: string;
  /** 省くのは、自分でラベルを持つ Checkbox を置くときだけ（必須/任意の札は Checkbox の行末に出る）。 */
  label?: ReactNode;
  /** 見出しを画面から隠し、読み上げとラベル検索には残す（Fieldset 内の姓・名など）。 */
  hideLabel?: boolean;
  labelSize?: "md" | "sm";
  /** 必須/任意の札を出し、中の入力の required を決める唯一の指定。省くと囲む Fieldset に従う。 */
  requirement?: Requirement;
  visibility?: Visibility;
  /** 入力欄の上に出す案内。 */
  lead?: ReactNode;
  /** 入力欄の下に出す案内。 */
  description?: ReactNode;
  /** Form の外で画面側が判定したエラー。サーバーのエラーは Form の errors で渡す。 */
  error?: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

/** 見出し・案内・エラーを1つの入力に結びつける項目。 */
export function Field({
  name,
  label,
  hideLabel = false,
  labelSize = "md",
  requirement,
  visibility,
  lead,
  description,
  error,
  disabled,
  className,
  children,
}: FieldProps) {
  const parent = useFieldContext();
  const required = requirement === undefined ? parent.required : requirement === "required";

  return (
    <BaseField.Root
      className={cx(fieldRecipe({ spacing: hideLabel ? "none" : "stack" }), className)}
      disabled={disabled}
      invalid={error !== undefined}
      name={name}
    >
      {label === undefined ? null : hideLabel ? (
        <BaseField.Label className={srOnlyStyle}>{label}</BaseField.Label>
      ) : (
        <LabelRow
          requirement={requirement}
          size={labelSize}
          visibility={
            visibility === undefined ? null : (
              <BaseField.Description className={visibilityRecipe({ visibility })}>
                <VisibilityText visibility={visibility} />
              </BaseField.Description>
            )
          }
        >
          <BaseField.Label>{label}</BaseField.Label>
        </LabelRow>
      )}
      {lead === undefined ? null : (
        <BaseField.Description className={guideRecipe({ placement: "above" })}>
          {lead}
        </BaseField.Description>
      )}
      <FieldContext.Provider
        value={{
          required,
          inRoot: true,
          requirement: label === undefined ? requirement : undefined,
        }}
      >
        {children}
      </FieldContext.Provider>
      {description === undefined ? null : (
        <BaseField.Description className={guideRecipe({ placement: "below" })}>
          {description}
        </BaseField.Description>
      )}
      <FieldErrorText error={error} />
    </BaseField.Root>
  );
}

/** 見出しの行。札は label の外に置き、入力のアクセシブルな名前を見出しの文字だけにする。 */
export function LabelRow({
  size,
  requirement,
  visibility,
  children,
}: {
  size: "md" | "sm";
  requirement?: Requirement;
  visibility: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={labelRowRecipe({ size })}>
      {children}
      {requirement === undefined ? null : <RequirementBadge requirement={requirement} />}
      {visibility}
    </div>
  );
}

export function RequirementBadge({ requirement }: { requirement: Requirement }) {
  return requirement === "required" ? (
    <Badge variant="required">必須</Badge>
  ) : (
    <Badge variant="optional">任意</Badge>
  );
}

export function VisibilityText({ visibility }: { visibility: Visibility }) {
  return visibility === "public" ? (
    <>
      <Icon name="public" size="2xs" />
      公開<span className={srOnlyStyle}>されます</span>
    </>
  ) : (
    <>
      <Icon name="lock" size="2xs" />
      <span aria-hidden="true">非公開</span>
      <span className={srOnlyStyle}>公開されません</span>
    </>
  );
}

/** Form の errors とブラウザの検証結果を出す。error を渡すと常にそれを出す。 */
export function FieldErrorText({ error }: { error?: string }) {
  // サーバーのエラーはフォーカスを動かさずに届くので、role="alert" で読み上げる
  return error === undefined ? (
    <BaseField.Error className={fieldErrorStyle} role="alert" />
  ) : (
    <BaseField.Error className={fieldErrorStyle} match role="alert">
      {error}
    </BaseField.Error>
  );
}

type ChoiceProps = {
  look: "inline" | "row" | "note" | "card" | "chip";
  mark: "checkbox" | "radio";
  size?: "md" | "sm";
  tone?: "default" | "danger";
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
  /** 受け取った frame を Checkbox.Root / Radio.Root の render に渡す。 */
  children: (frame: (props: HTMLProps) => ReactElement) => ReactNode;
};

/**
 * チェックボックス・ラジオの選択肢1件。Field.Root の中でしか使えない。
 * 印を nativeButton の button にして label で包み、Base UI の隠し input を label の外に出す
 * （隠し input まで label に結ばれると、getByLabel が2要素に当たる）。
 */
export function Choice({
  look,
  mark,
  size,
  tone,
  label,
  description,
  disabled,
  className,
  children,
}: ChoiceProps) {
  return (
    <BaseField.Item className={cx(choiceItemStyle, className)} disabled={disabled}>
      {children((props) => (
        <BaseField.Label className={choiceRecipe({ look, size, tone })}>
          <button {...props} />
          <span>{label}</span>
        </BaseField.Label>
      ))}
      {description === undefined ? null : (
        <BaseField.Description className={choiceDescriptionRecipe({ mark })}>
          {description}
        </BaseField.Description>
      )}
    </BaseField.Item>
  );
}
