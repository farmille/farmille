import { Icon } from "./Icon";

import { Toaster as Sonner } from "sonner";

import { css } from "../../styled-system/css";
import { token } from "../../styled-system/tokens";

export { toast } from "sonner";

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
  borderRadius: "button",
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
    outlineOffset: "0.5",
  },
});

const placements = {
  top: { position: "top-center", offset: { top: token.var("spacing.16") } },
  bottom: { position: "bottom-center", offset: { bottom: token.var("spacing.20") } },
} as const;

type ToasterProps = {
  /** 画面が自分の出口を持つときの名前。`toast(…, { toasterId })` でこの出口に出す。省くとアプリ全体の出口。 */
  id?: string;
  placement?: keyof typeof placements;
  /** 通知の領域の読み上げ名。同じ画面に出口が2つあるときは呼び分けられる名前にする。 */
  label?: string;
};

/**
 * 通知の出口。アプリ全体の出口は layout に1つだけ置き、表示は `toast()` を呼ぶ。
 * 下端に操作バーを固定した画面（レポートの入力など）は、id 付きの出口を自分で置いて toasterId で出す。
 */
export function Toaster({ id, placement = "top", label = "通知" }: ToasterProps) {
  const { position, offset } = placements[placement];

  return (
    <Sonner
      id={id}
      position={position}
      customAriaLabel={label}
      duration={4000}
      icons={{
        success: <Icon name="check" />,
        info: <Icon name="info" />,
        warning: <Icon name="warning" />,
        error: <Icon name="error" />,
        loading: (
          <Icon
            name="loader"
            className={css({
              animation: "[icon-spin 1s linear infinite]",
              _motionReduce: { animation: "none" },
            })}
          />
        ),
        close: <Icon name="close" size="sm" />,
      }}
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
