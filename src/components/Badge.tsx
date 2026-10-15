import { cva, cx, type RecipeVariantProps } from "../../styled-system/css";

const badgeRecipe = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "1",
    fontWeight: "bold",
    whiteSpace: "nowrap",
    borderRadius: "pill",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent",
  },
  variants: {
    variant: {
      official: {
        color: "accent.official",
        fontSize: "sm",
        fontWeight: "semibold",
        bg: "transparent",
        borderColor: "transparent",
        gap: "1",
        px: "0",
        py: "0",
      },
      type: {
        fontSize: "2xs",
        px: "2.5",
        py: "0.5",
        bg: "primary.soft",
        color: "primary.800",
        borderColor: "transparent",
      },
      published: {
        fontSize: "2xs",
        px: "2",
        py: "0.5",
        bg: "primary.soft",
        color: "primary.800",
        borderColor: "transparent",
      },
      draft: {
        fontSize: "2xs",
        px: "2",
        py: "0.5",
        bg: "surface.page",
        color: "text.muted",
        borderColor: "border.default",
      },
      optional: {
        fontSize: "2xs",
        lineHeight: "none",
        px: "1.5",
        py: "0.5",
        bg: "surface.page",
        color: "text.subtle",
        borderColor: "border.default",
      },
      required: {
        fontSize: "2xs",
        lineHeight: "none",
        px: "1.5",
        py: "0.5",
        bg: "accent.dangerSoft",
        color: "accent.danger",
        borderColor: "transparent",
      },
    },
  },
  defaultVariants: {
    variant: "type",
  },
});

export type BadgeVariants = RecipeVariantProps<typeof badgeRecipe>;

type BadgeProps = BadgeVariants & {
  children: React.ReactNode;
  className?: string;
};

/** 公式・タイプ・必須/任意などの小バッジ。 */
export function Badge({ variant, children, className }: BadgeProps) {
  return <span className={cx(badgeRecipe({ variant }), className)}>{children}</span>;
}

export { badgeRecipe };
