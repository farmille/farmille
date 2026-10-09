import { cva, cx, type RecipeVariantProps } from "../../styled-system/css";

const selectRecipe = cva({
  base: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.strong",
    bg: "surface.card",
    color: "text.default",
    borderRadius: "input",
    fontFamily: "sans",
    _focus: {
      outlineWidth: "1px",
      outlineStyle: "solid",
      outlineColor: "primary.200",
      borderColor: "primary.600",
    },
    "&[aria-invalid=true]": { borderColor: "accent.danger" },
    _disabled: { opacity: "disabled", cursor: "not-allowed" },
  },
  variants: {
    size: {
      md: { w: "100%", px: "3", py: "2.5", fontSize: "md" },
      sm: { w: "auto", px: "3", py: "2", fontSize: "sm" },
    },
  },
  defaultVariants: { size: "md" },
});

type SelectProps = RecipeVariantProps<typeof selectRecipe> &
  Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
    className?: string;
  };

/** セレクト（モック select.input）。size="sm" は並び替えなどの幅が内容に合うコンパクト版。 */
export function Select({ size, className, children, ...rest }: SelectProps) {
  return (
    <select className={cx(selectRecipe({ size }), className)} {...rest}>
      {children}
    </select>
  );
}
