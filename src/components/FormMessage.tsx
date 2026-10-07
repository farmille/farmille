import { cva } from "../../styled-system/css";

const messageRecipe = cva({
  base: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "input",
    px: "3",
    py: "2.5",
    fontSize: "sm",
    fontWeight: "bold",
    lineHeight: "normal",
  },
  variants: {
    status: {
      success: {
        bg: "primary.soft",
        color: "primary.700",
        borderColor: "primary.600/30",
      },
      error: {
        bg: "accent.warnSoft",
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
