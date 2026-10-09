"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Field as BaseField } from "@base-ui/react/field";
import type { ReactNode } from "react";

import { Icon } from "@/components/Icon";
import { Choice, RequirementBadge } from "./Field";
import { useFieldContext } from "./field-context";
import { checkboxBoxRecipe, checkIndicatorStyle } from "./recipes";

type CheckboxProps = {
  /** チェックボックスの名前になる文。リンクを含めてよい。 */
  children: ReactNode;
  description?: ReactNode;
  variant?: "inline" | "row";
  value?: string;
  name?: string;
  disabled?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
};

/** 文ごと押せるチェックボックス。同意欄は variant="row" の枠付きの行にする。 */
export function Checkbox({
  children,
  description,
  variant = "inline",
  value,
  name,
  disabled,
  checked,
  defaultChecked,
  onCheckedChange,
  className,
}: CheckboxProps) {
  const { required, inRoot, requirement } = useFieldContext();
  const choice = (
    <Choice
      className={inRoot ? className : undefined}
      description={description}
      disabled={disabled}
      label={
        <>
          {children}
          {/* 必須であることは aria-required で伝わるので、札は名前に含めない */}
          {requirement === undefined ? null : (
            <span aria-hidden="true">
              {" "}
              <RequirementBadge requirement={requirement} />
            </span>
          )}
        </>
      }
      look={variant}
      mark="checkbox"
    >
      {(frame) => (
        <BaseCheckbox.Root
          checked={checked}
          className={checkboxBoxRecipe()}
          defaultChecked={defaultChecked}
          name={name}
          nativeButton
          onCheckedChange={onCheckedChange}
          render={frame}
          required={required}
          value={value}
        >
          <BaseCheckbox.Indicator className={checkIndicatorStyle}>
            <Icon name="check" size="xs" />
          </BaseCheckbox.Indicator>
        </BaseCheckbox.Root>
      )}
    </Choice>
  );

  // Field の外では自分の Field.Root を持ち、Form の検証と errors の対象にする
  return inRoot ? (
    choice
  ) : (
    <BaseField.Root className={className} disabled={disabled} name={name}>
      {choice}
    </BaseField.Root>
  );
}
