import Link from "next/link";

import { Icon } from "@/components/Icon";
import { css } from "../../../styled-system/css";

const entry = css({
  display: "block",
  w: "100%",
  // ヒーローのゴシックMB101（weight 300 のみ）を継承すると太字が合成されるため本文書体に戻す
  fontFamily: "sans",
  color: "text.default",
  textDecoration: "none",
  borderRadius: "card",
  _focusVisible: {
    outlineWidth: "3px",
    outlineStyle: "solid",
    outlineColor: "brand.primary",
    outlineOffset: "3px",
  },
});

const searchBox = css({
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  minH: "56px",
  w: "100%",
  bg: "surface.card",
  borderWidth: "1.5px",
  borderStyle: "solid",
  borderColor: "border.strong",
  borderRadius: "pill",
  boxShadow: "shadow.lift",
  px: "4",
  py: "2",
  md: {
    minH: "72px",
    px: "6",
    py: "3",
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
  display: "flex",
  flexDirection: "column",
  gap: "0.5",
  color: "text.default",
  fontSize: "sm",
  fontWeight: "700",
  textAlign: "left",
  md: { fontSize: "lg" },
});

const hint = css({
  color: "text.subtle",
  fontSize: "2xs",
  fontWeight: "500",
  md: { fontSize: "sm" },
});

const actionGroup = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  flexShrink: "0",
  color: "brand.primaryDeep",
  fontSize: "xs",
  fontWeight: "700",
});

const action = css({
  w: "36px",
  h: "36px",
  borderRadius: "pill",
  bg: "brand.primary",
  color: "surface.card",
  display: "grid",
  placeItems: "center",
  flexShrink: "0",
  md: {
    w: "44px",
    h: "44px",
  },
});

const categoryRow = css({
  display: "flex",
  gap: "1.5",
  mt: "3",
  overflowX: "auto",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
  md: {
    gap: "2.5",
    mt: "4",
  },
});

const category = css({
  display: "inline-flex",
  alignItems: "center",
  flexShrink: "0",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.strong",
  borderRadius: "pill",
  bg: "surface.card",
  color: "text.muted",
  px: "2.5",
  py: "1.5",
  fontSize: "xs",
  fontWeight: "600",
  md: {
    px: "4",
    py: "2",
    fontSize: "sm",
  },
});

const categories = ["作物", "効果", "製品タイプ", "メーカー"] as const;

export function HomeSearchEntry() {
  return (
    <Link
      aria-label="資材を検索する。作物、悩み、資材名から探せます"
      className={entry}
      href="/search"
    >
      <span className={searchBox}>
        <span className={icon} aria-hidden>
          <Icon name="search" size="md" />
        </span>
        <span className={label}>
          資材を検索する
          <span className={hint}>作物・悩み・資材名から</span>
        </span>
        <span className={actionGroup} aria-hidden>
          検索へ
          <span className={action}>
            <Icon name="chevron_right" size="sm" />
          </span>
        </span>
      </span>
      <span className={categoryRow} aria-hidden>
        {categories.map((categoryLabel) => (
          <span className={category} key={categoryLabel}>
            {categoryLabel}
          </span>
        ))}
      </span>
    </Link>
  );
}
