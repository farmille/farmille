import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentPropsWithRef } from "react";

import { cva, cx, type RecipeVariantProps } from "../../styled-system/css";

const buttonRecipe = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "2",
    fontFamily: "sans",
    fontWeight: "bold",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent",
    cursor: "pointer",
    textDecoration: "none",
    borderRadius: "button",
    lineHeight: "tight",
    maxW: "full",
    textAlign: "center",
    overflowWrap: "anywhere",
    _disabled: { opacity: "disabled", cursor: "not-allowed" },
  },
  variants: {
    variant: {
      primary: {
        bg: "primary.700",
        color: "text.inverse",
        borderColor: "transparent",
      },
      ghost: {
        bg: "surface.card",
        color: "text.brand",
        borderColor: "border.strong",
      },
      danger: {
        bg: "accent.dangerSoft",
        color: "accent.danger",
        borderColor: "accent.danger",
      },
    },
    size: {
      md: {
        w: "full",
        px: "6",
        minW: "button.md",
        py: "3",
        fontSize: "md",
      },
      sm: {
        w: "auto",
        px: "6",
        minW: "button.sm",
        py: "2",
        fontSize: "sm",
      },
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export type ButtonVariants = RecipeVariantProps<typeof buttonRecipe>;

type ButtonProps = ButtonVariants &
  Omit<ComponentPropsWithRef<"button">, "color" | "className"> & {
    className?: string;
    /** 押せない間もフォーカスを残す（送信中のボタンなど）。aria-disabled で無効を伝える。 */
    focusableWhenDisabled?: boolean;
  };

/** プライマリ／ゴースト／危険の共通ボタン（モック .btn）。 */
export function Button({ variant, size, className, type = "button", ...rest }: ButtonProps) {
  return (
    <BaseButton {...rest} className={cx(buttonRecipe({ variant, size }), className)} type={type} />
  );
}

export { buttonRecipe };
