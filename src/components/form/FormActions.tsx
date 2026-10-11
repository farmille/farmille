import type { ReactNode } from "react";

import { cva, cx } from "../../../styled-system/css";

const formActionsRecipe = cva({
  base: { display: "flex", gap: "2.5" },
  variants: {
    layout: {
      stack: { flexDirection: "column", mt: "6" },
      row: { flexWrap: "wrap", mt: "6" },
      links: { flexDirection: "column", mt: "5", textAlign: "center" },
    },
  },
  defaultVariants: { layout: "stack" },
});

type FormActionsProps = {
  layout?: "stack" | "row" | "links";
  children: ReactNode;
  className?: string;
};

/** フォーム末尾の操作の並び。links は送信ボタンの下に置く導線の列。 */
export function FormActions({ layout, children, className }: FormActionsProps) {
  return <div className={cx(formActionsRecipe({ layout }), className)}>{children}</div>;
}
