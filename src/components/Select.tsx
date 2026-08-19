import { cva, cx } from "../../styled-system/css";

const selectRecipe = cva({
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
    _focus: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "brand.soft",
      borderColor: "brand.primary",
    },
  },
});

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  className?: string;
};

/** セレクト（モック select.input）。 */
export function Select({ className, children, ...rest }: SelectProps) {
  return (
    <select className={cx(selectRecipe(), className)} {...rest}>
      {children}
    </select>
  );
}

export { selectRecipe };
