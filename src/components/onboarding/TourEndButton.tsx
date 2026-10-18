"use client";

import { Icon } from "@/components/Icon";

import { css } from "../../../styled-system/css";

const endStyle = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5",
  flexShrink: 0,
  minH: "10",
  px: "2.5",
  whiteSpace: "nowrap",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "pill",
  bg: "surface.card",
  color: "text.default",
  fontSize: "sm",
  fontWeight: "bold",
  boxShadow: "overlay",
  cursor: "pointer",
  _focusVisible: { outlineWidth: "2px", outlineStyle: "solid", outlineColor: "primary.700" },
});

/** 案内そのものを終える。シートと吹き出しの右上に、どの場面でも出す。 */
export function TourEndButton({ onEnd }: { onEnd: () => void }) {
  return (
    <button type="button" className={endStyle} onClick={onEnd}>
      <Icon name="close" size="xs" />
      チュートリアルを終了
    </button>
  );
}
