import type { InputHTMLAttributes } from "react";
import { css, cx } from "../../styled-system/css";

const checkboxStyle = css({
  accentColor: "primary.700",
  w: "4",
  h: "4",
  flexShrink: "0",
  verticalAlign: "middle",
  cursor: "pointer",
  _disabled: { cursor: "not-allowed" },
});

export const checkboxChipStyle = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "pill",
  px: "2.5",
  py: "1.5",
  fontSize: "sm",
  cursor: "pointer",
  "&:has(input:checked)": { borderColor: "primary.600" },
});

export function Checkbox({
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return <input {...props} type="checkbox" className={cx(checkboxStyle, className)} />;
}
