"use client";

import { Icon } from "@/components/Icon";

import { css } from "../../../styled-system/css";

const endStyle = css({
  w: "10",
  h: "10",
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
  // 押せる範囲は 40px のまま、外側の余白を詰めて、見える × を見出し行の角に寄せる
  m: "-2",
  padding: "0",
  borderWidth: "0",
  borderRadius: "button",
  bg: "transparent",
  color: "text.muted",
  cursor: "pointer",
  _focusVisible: { outlineWidth: "2px", outlineStyle: "solid", outlineColor: "primary.700" },
});

/** 案内そのものを終える。シートと吹き出しの右上に、どの場面でも出す。 */
export function TourEndButton({ onEnd }: { onEnd: () => void }) {
  return (
    <button type="button" className={endStyle} onClick={onEnd} aria-label="チュートリアルを終了">
      <Icon name="close" size="md" />
    </button>
  );
}
