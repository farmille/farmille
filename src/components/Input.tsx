import { forwardRef } from "react";
import { cva, cx, type RecipeVariantProps } from "../../styled-system/css";

const inputRecipe = cva({
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
    _placeholder: { color: "text.subtle" },
    _focus: {
      outlineWidth: "1px",
      outlineStyle: "solid",
      outlineColor: "primary.200",
      borderColor: "primary.600",
    },
    _disabled: { opacity: "disabled", cursor: "not-allowed" },
  },
});

export type InputVariants = RecipeVariantProps<typeof inputRecipe>;

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  className?: string;
};

/** 単行テキスト入力（モック .input）。 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...rest },
  ref,
) {
  return <input className={cx(inputRecipe(), className)} ref={ref} {...rest} />;
});

export { inputRecipe };
