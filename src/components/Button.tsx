import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentPropsWithRef } from "react";

import { Icon } from "./Icon";
import { css, cva, cx, type RecipeVariantProps } from "../../styled-system/css";

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
    /** 読み込み中。回る印を文字の上に重ねる */
    loading: {
      true: { position: "relative" },
      false: {},
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
    loading: false,
  },
});

export type ButtonVariants = RecipeVariantProps<typeof buttonRecipe>;

// 読み込み中は文字を見えなくして幅を保ち、その上に回る印を重ねる
const loadingLabelStyle = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "[inherit]",
  opacity: "0",
});

const spinnerStyle = css({
  position: "absolute",
  inset: "0",
  m: "auto",
  animation: "[icon-spin 1s linear infinite]",
  _motionReduce: { animation: "none" },
});

type ButtonProps = ButtonVariants &
  Omit<ComponentPropsWithRef<"button">, "color" | "className"> & {
    className?: string;
    /** 押せない間もフォーカスを残す（送信中のボタンなど）。aria-disabled で無効を伝える。 */
    focusableWhenDisabled?: boolean;
  };

/**
 * プライマリ／ゴースト／危険の共通ボタン（モック .btn）。
 * loading の間は押せなくし、文字の幅を保ったまま回る印を出す。押したボタンからフォーカスは外さない。
 */
export function Button({
  variant,
  size,
  className,
  type = "button",
  loading = false,
  disabled,
  focusableWhenDisabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <BaseButton
      {...rest}
      className={cx(buttonRecipe({ variant, size, loading }), className)}
      type={type}
      disabled={disabled === true || loading}
      focusableWhenDisabled={focusableWhenDisabled === true || loading}
      aria-busy={loading ? true : undefined}
    >
      {loading ? (
        <>
          <span className={loadingLabelStyle}>{children}</span>
          <Icon name="loader" size="sm" className={spinnerStyle} />
        </>
      ) : (
        children
      )}
    </BaseButton>
  );
}

export { buttonRecipe };
