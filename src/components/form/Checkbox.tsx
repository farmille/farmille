"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import type { ReactNode } from "react";

import { Icon } from "@/components/Icon";
import { Choice, EnsureFieldRoot, RequirementBadge } from "./Field";
import { useFieldContext, useResetKey } from "./field-context";
import { checkboxBoxRecipe, checkIndicatorStyle } from "./recipes";

type CheckboxProps = {
  /** チェックボックスの名前になる文。リンクを含めてよい。 */
  children: ReactNode;
  description?: ReactNode;
  /** row は短い同意の太字の行、note は長い注意書きへの同意を控えめに置く行。 */
  variant?: "inline" | "row" | "note";
  size?: "md" | "sm";
  tone?: "default" | "danger";
  value?: string;
  name?: string;
  disabled?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
};

export function Checkbox({
  children,
  description,
  variant = "inline",
  size,
  tone,
  value,
  name,
  disabled,
  checked,
  defaultChecked,
  onCheckedChange,
  className,
}: CheckboxProps) {
  const { required, inRoot, requirement } = useFieldContext();
  const resetKey = useResetKey(String(defaultChecked === true));
  const choice = (
    <Choice
      className={inRoot ? className : undefined}
      description={description}
      disabled={disabled}
      label={
        <>
          {children}
          {requirement === undefined ? null : (
            <span aria-hidden="true">
              {" "}
              <RequirementBadge requirement={requirement} />
            </span>
          )}
        </>
      }
      look={variant}
      size={size}
      tone={tone}
    >
      {(frame) => (
        <BaseCheckbox.Root
          key={resetKey}
          checked={checked}
          className={checkboxBoxRecipe({ size })}
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

  return (
    <EnsureFieldRoot className={className} disabled={disabled} name={name}>
      {choice}
    </EnsureFieldRoot>
  );
}
