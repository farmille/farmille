import Form from "next/form";

import { Icon } from "@/components/Icon";
import { css } from "../../../styled-system/css";

const entry = css({
  display: "block",
  w: "100%",
  m: "0",
  // ヒーローのゴシックMB101（weight 300 のみ）を継承すると太字が合成されるため本文書体に戻す
  fontFamily: "sans",
});

/** 写真の上に置く前提の暗いガラス面。ink の薄い透過にごく弱いぼかしを掛け、縁は白い髪の毛線で切る。文字は少し透けた白。 */
const searchBox = css({
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  minH: "56px",
  w: "100%",
  bg: "ink/24",
  backdropFilter: "blur(3px)",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "surface.card/35",
  borderRadius: "pill",
  boxShadow: "shadow.glass",
  px: "4",
  py: "2",
  // 送信ボタンのフォーカスでも面の枠が出る _focusWithin は使わず、入力欄のときだけ枠を出す
  "&:has(input:focus-visible)": {
    outlineWidth: "3px",
    outlineStyle: "solid",
    outlineColor: "brand.primary",
    outlineOffset: "3px",
  },
  tab: {
    minH: "72px",
    px: "6",
    py: "3",
  },
});

const icon = css({
  display: "flex",
  color: "surface.card/90",
  flexShrink: "0",
});

/** iOS Safari は 16px 未満の入力欄にフォーカスすると自動ズームするため、全幅で lg（16px）に固定する。 */
const input = css({
  flex: "1",
  minW: "0",
  bg: "transparent",
  borderWidth: "0",
  outline: "none",
  p: "0",
  fontFamily: "sans",
  fontSize: "lg",
  fontWeight: "700",
  color: "surface.card",
  caretColor: "surface.card",
  appearance: "none",
  _placeholder: { color: "surface.card/90", fontWeight: "500" },
  "&::-webkit-search-cancel-button": { display: "none" },
  "&::-webkit-search-decoration": { display: "none" },
});

const submit = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  flexShrink: "0",
  color: "surface.card/90",
  fontSize: "xs",
  fontWeight: "700",
  bg: "transparent",
  borderWidth: "0",
  p: "0",
  cursor: "pointer",
  fontFamily: "sans",
  _focusVisible: {
    outlineWidth: "3px",
    outlineStyle: "solid",
    outlineColor: "brand.primary",
    outlineOffset: "3px",
  },
});

/** 右端の丸ボタン。面と同じく透かし、写真の色を少し通す。矢印の白は UI 部品の 3：1 を下限にする。 */
const action = css({
  w: "36px",
  h: "36px",
  borderRadius: "pill",
  bg: "brand.primary/72",
  backdropFilter: "blur(3px)",
  color: "surface.card",
  display: "grid",
  placeItems: "center",
  flexShrink: "0",
  tab: {
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
  tab: {
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
  borderColor: "surface.card/35",
  borderRadius: "pill",
  bg: "ink/20",
  backdropFilter: "blur(2px)",
  color: "surface.card/88",
  px: "2.5",
  py: "1.5",
  fontSize: "xs",
  fontWeight: "600",
  tab: {
    px: "4",
    py: "2",
    fontSize: "sm",
  },
});

const categories = ["作物", "効果", "資材ジャンル", "メーカー"] as const;

export function HomeSearchEntry() {
  return (
    <Form action="/search" aria-label="資材検索" className={entry} role="search">
      <div className={searchBox}>
        <span className={icon} aria-hidden>
          <Icon name="search" size="md" />
        </span>
        <input
          aria-label="資材を検索する。作物、悩み、資材名から探せます"
          autoComplete="off"
          className={input}
          enterKeyHint="search"
          name="q"
          placeholder="作物・悩み・資材名から探す"
          type="search"
        />
        <button className={submit} type="submit">
          検索
          <span className={action} aria-hidden>
            <Icon name="chevron_right" size="sm" />
          </span>
        </button>
      </div>
      <div className={categoryRow} aria-hidden>
        {categories.map((categoryLabel) => (
          <span className={category} key={categoryLabel}>
            {categoryLabel}
          </span>
        ))}
      </div>
    </Form>
  );
}
