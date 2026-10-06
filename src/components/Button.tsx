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
    lineHeight: "tight",
    maxW: "100%",
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
        color: "primary.700",
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
        w: "100%",
        borderRadius: "button",
        px: "6",
        minW: "button.md",
        py: "3",
        fontSize: "md",
      },
      sm: {
        w: "auto",
        borderRadius: "pill",
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
