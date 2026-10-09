import { Toaster as Sonner } from "sonner";

import { css } from "../../styled-system/css";
import { token } from "../../styled-system/tokens";

export { toast } from "sonner";

// Sonner は上端から 400ms の ease で降りて同じ上端へ戻る。入退場の動きは Sonner のまま使う
const toastStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  w: "full",
  px: "4",
  py: "3",
  bg: "primary.700",
  color: "text.inverse",
  borderRadius: "card",
  boxShadow: "shadow.lift",
  fontFamily: "sans",
  fontSize: "sm",
  fontWeight: "bold",
  lineHeight: "normal",
});

const contentStyle = css({ flex: "1", minW: "0", textAlign: "center" });

const actionStyle = css({
  flexShrink: "0",
  px: "3",
  py: "1",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "text.inverse/60",
  borderRadius: "pill",
  bg: "transparent",
  color: "text.inverse",
  fontFamily: "sans",
  fontSize: "sm",
  fontWeight: "bold",
  cursor: "pointer",
  _hover: { bg: "text.inverse/15" },
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "text.inverse",
    outlineOffset: "2px",
  },
});

// AppBar の下に出す
const offset = { top: token.var("spacing.16") };

/** アプリ全体で1つだけ置く通知の出口。表示は `toast()` を呼ぶ。 */
export function Toaster() {
  return (
    <Sonner
      position="top-center"
      customAriaLabel="通知"
      duration={4000}
      offset={offset}
      mobileOffset={offset}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: toastStyle,
          content: contentStyle,
          actionButton: actionStyle,
          cancelButton: actionStyle,
        },
      }}
    />
  );
}
