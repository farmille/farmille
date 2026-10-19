"use client";

import { Icon } from "@/components/Icon";

import { css } from "../../../styled-system/css";

const labelStyle = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  alignSelf: "flex-start",
  px: "2.5",
  py: "1",
  borderRadius: "pill",
  bg: "primary.700",
  color: "text.inverse",
  fontSize: "xs",
  fontWeight: "bold",
  whiteSpace: "nowrap",
});

/** 案内の途中であることと、3段階のどこにいるかを、緑の塗りのラベルではっきり示す。 */
export function TourLabel({ section }: { section: number }) {
  return (
    <span className={labelStyle}>
      <Icon name="eco" size="xs" />
      チュートリアル中　{section} / 3
    </span>
  );
}
