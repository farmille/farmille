"use client";

import { Field as BaseField } from "@base-ui/react/field";
import type { HTMLProps } from "@base-ui/react/types";
import type { ReactElement, ReactNode } from "react";

import { Badge } from "@/components/Badge";
import { Icon } from "@/components/Icon";
import { cx } from "../../../styled-system/css";
import { FieldContext, useFieldContext, useFieldValidate } from "./field-context";
import {
  choiceDescriptionStyle,
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
  name?: string;
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
  /** 形式が合わないときの文言を、入力欄の種類に合わせて差し替える（メールアドレスの Input が渡す）。 */
  typeMismatchMessage?: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

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
  typeMismatchMessage,
  disabled,
  className,
  children,
}: FieldProps) {
  const parent = useFieldContext();
  const required = requirement === undefined ? parent.required : requirement === "required";
  const validate = useFieldValidate(name);

  return (
    <BaseField.Root
      className={cx(fieldRecipe({ spacing: hideLabel ? "none" : "stack" }), className)}
      disabled={disabled}
      invalid={error !== undefined}
      name={name}
      validate={validate}
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
          inField: true,
          requirement: label === undefined ? requirement : undefined,
          name,
        }}
      >
        {children}
      </FieldContext.Provider>
      {/* エラーは入力欄の真下に出す。説明はその下 */}
      <FieldErrorText error={error} typeMismatchMessage={typeMismatchMessage} />
      {description === undefined ? null : (
        <BaseField.Description className={guideRecipe({ placement: "below" })}>
          {description}
        </BaseField.Description>
      )}
    </BaseField.Root>
  );
}

/** 囲む Field が無いときだけ自分の Field.Root で包み、Form の検証と errors の対象にする。 */
export function EnsureFieldRoot({
  name,
  disabled,
  className,
  children,
}: Pick<FieldProps, "name" | "disabled" | "className" | "children">) {
  const validate = useFieldValidate(name);
  return useFieldContext().inRoot ? (
    children
  ) : (
    <BaseField.Root className={className} disabled={disabled} name={name} validate={validate}>
      {children}
    </BaseField.Root>
  );
}

export function LabelRow({
  size,
  requirement,
  visibility,
  visuallyHidden = false,
  children,
}: {
  size: "md" | "sm";
  requirement?: Requirement;
  visibility: ReactNode;
  visuallyHidden?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(labelRowRecipe({ size }), visuallyHidden ? srOnlyStyle : undefined)}
      data-visually-hidden={visuallyHidden ? "" : undefined}
    >
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
      <Icon name="visibility_off" size="2xs" />
      <span className={srOnlyStyle}>公開されません</span>
    </>
  );
}

/**
 * ブラウザの制約検証の結果ごとの文言。ブラウザ任せだと閲覧環境の言語（英語など）で出るので日本語に固定する。
 * 送信時は最初の不備へフォーカスが移り、その説明として読まれるので role="alert" は付けない（Form の validate の文言も同じ）。
 */
const VALIDITY_MESSAGES = [
  ["valueMissing", "この項目は必須です。"],
  ["typeMismatch", "入力の形式が正しくありません。"],
  ["patternMismatch", "入力の形式が正しくありません。"],
  ["tooShort", "文字数が足りません。"],
  ["tooLong", "文字数が多すぎます。"],
  ["rangeUnderflow", "入力できる範囲より小さい値です。"],
  ["rangeOverflow", "入力できる範囲より大きい値です。"],
  ["stepMismatch", "入力できる値の刻みに合っていません。"],
  ["badInput", "入力内容を確認してください。"],
] as const;

/**
 * Form の errors・Form の validate・ブラウザの検証結果を出す。error を渡すと常にそれを出す。
 * validate の文言は欄ごとに具体的なので、同じ欄のブラウザの判定（必須など）より優先する。
 */
export function FieldErrorText({
  error,
  typeMismatchMessage,
}: {
  error?: string;
  typeMismatchMessage?: string;
}) {
  if (error !== undefined) {
    return (
      <BaseField.Error className={fieldErrorStyle} match role="alert">
        {error}
      </BaseField.Error>
    );
  }
  return (
    <BaseField.Validity>
      {({ validity }) => {
        if (validity.customError) return <BaseField.Error className={fieldErrorStyle} />;
        const native = VALIDITY_MESSAGES.find(([key]) => validity[key]);
        if (native === undefined)
          return <BaseField.Error className={fieldErrorStyle} role="alert" />;
        const [match, message] = native;
        return (
          <BaseField.Error className={fieldErrorStyle} match={match}>
            {match === "typeMismatch" ? (typeMismatchMessage ?? message) : message}
          </BaseField.Error>
        );
      }}
    </BaseField.Validity>
  );
}

type ChoiceProps = {
  look: "inline" | "row" | "note" | "card" | "chip";
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
        <BaseField.Label
          className={choiceRecipe({ look, size, tone, described: description !== undefined })}
        >
          <button {...props} />
          <span>
            {label}
            {description === undefined ? null : (
              // 名前からは外し、aria-describedby で説明として読ませる
              <BaseField.Description
                aria-hidden
                className={choiceDescriptionStyle}
                render={<span />}
              >
                {description}
              </BaseField.Description>
            )}
          </span>
        </BaseField.Label>
      ))}
    </BaseField.Item>
  );
}
