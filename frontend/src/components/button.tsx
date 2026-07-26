import { cva, cx, type RecipeVariantProps } from "../../styled-system/css";

const buttonRecipe = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "2",
    fontFamily: "sans",
    fontWeight: "700",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent",
    cursor: "pointer",
    textDecoration: "none",
    lineHeight: "1.3",
    transitionProperty: "background-color, border-color, color",
    transitionDuration: "0.15s",
  },
  variants: {
    variant: {
      primary: {
        bg: "brand.primary",
        color: "surface.card",
        borderColor: "transparent",
      },
      ghost: {
        bg: "surface.card",
        color: "brand.primary",
        borderColor: "border.strong",
      },
      // 危険操作。専用 red トークン未定義のため amber（accent.warn）で近似。要トークン追加は報告参照。
      danger: {
        bg: "amber.soft",
        color: "accent.warn",
        borderColor: "accent.warn",
      },
    },
    size: {
      md: {
        w: "100%",
        borderRadius: "button",
        px: "3",
        py: "3",
        fontSize: "md",
      },
      sm: {
        w: "auto",
        borderRadius: "pill",
        px: "4",
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
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> & {
    className?: string;
  };

/** プライマリ／ゴースト／危険の共通ボタン（モック .btn）。 */
export function Button({
  variant,
  size,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={cx(buttonRecipe({ variant, size }), className)} {...rest}>
      {children}
    </button>
  );
}

export { buttonRecipe };
