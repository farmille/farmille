import { forwardRef } from "react";
import { cva, cx, type RecipeVariantProps } from "../../styled-system/css";

const textareaRecipe = cva({
  base: {
    w: "100%",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.strong",
    bg: "surface.card",
    color: "text.default",
    borderRadius: "input",
    px: "3",
    py: "2.5",
    fontSize: "md",
    fontFamily: "sans",
    lineHeight: "1.6",
    resize: "vertical",
    minH: "84px",
    _placeholder: { color: "text.subtle" },
    _focus: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "brand.soft",
      borderColor: "brand.primary",
    },
  },
  variants: {
    size: {
      md: { minH: "84px" },
      lg: { minH: "120px" },
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type TextareaVariants = RecipeVariantProps<typeof textareaRecipe>;

type TextareaProps = TextareaVariants &
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    className?: string;
  };

/** 複数行入力（モック .textarea）。 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { size, className, ...rest },
  ref,
) {
  return <textarea className={cx(textareaRecipe({ size }), className)} ref={ref} {...rest} />;
});

export { textareaRecipe };
