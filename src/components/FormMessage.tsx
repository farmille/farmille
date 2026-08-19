import { cva } from "../../styled-system/css";

const messageRecipe = cva({
  base: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "input",
    px: "3",
    py: "2.5",
    fontSize: "sm",
    fontWeight: "700",
    lineHeight: "1.55",
  },
  variants: {
    status: {
      success: {
        bg: "brand.soft",
        color: "brand.primaryDeep",
        borderColor: "brand.primary/30",
      },
      error: {
        bg: "amber.soft",
        color: "accent.warn",
        borderColor: "accent.warn/30",
      },
    },
  },
  defaultVariants: {
    status: "success",
  },
});

type FormMessageProps = {
  status: "success" | "error";
  children: React.ReactNode;
};

/** Server Action の成功・失敗を同じ位置と見た目で伝える。 */
export function FormMessage({ status, children }: FormMessageProps) {
  return (
    <p className={messageRecipe({ status })} role={status === "error" ? "alert" : "status"}>
      {children}
    </p>
  );
}
