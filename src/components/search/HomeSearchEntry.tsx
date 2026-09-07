import Link from "next/link";

import { SearchIcon } from "@/components/Icons";
import { css } from "../../../styled-system/css";

const entry = css({
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  minH: "52px",
  w: "100%",
  bg: "surface.card",
  borderWidth: "1.5px",
  borderStyle: "solid",
  borderColor: "border.strong",
  borderRadius: "button",
  boxShadow: "shadow",
  px: "3.5",
  py: "2.5",
  color: "text.default",
  textDecoration: "none",
  _hover: {
    borderColor: "brand.primary",
    boxShadow: "shadow.lift",
  },
  _focusVisible: {
    outlineWidth: "3px",
    outlineStyle: "solid",
    outlineColor: "brand.soft",
    outlineOffset: "2px",
  },
});

const icon = css({
  display: "flex",
  color: "brand.primary",
  flexShrink: "0",
});

const label = css({
  flex: "1",
  minW: "0",
  color: "text.subtle",
  fontSize: "sm",
  textAlign: "left",
});

const action = css({
  color: "brand.primaryDeep",
  fontSize: "sm",
  fontWeight: "700",
  whiteSpace: "nowrap",
});

export function HomeSearchEntry() {
  return (
    <Link className={entry} href="/search">
      <span className={icon} aria-hidden>
        <SearchIcon size={19} />
      </span>
      <span className={label}>
        資材を検索する
        <br />
        （作物・悩み・資材名から）
      </span>
      <span className={action}>検索へ →</span>
    </Link>
  );
}
