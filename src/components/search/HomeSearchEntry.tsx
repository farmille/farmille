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
  minH: "12",
  w: "100%",
  bg: "scrim/24",
  backdropFilter: "blur(3px)",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "text.inverse/35",
  borderRadius: "pill",
  boxShadow: "shadow.glass",
  px: "4",
  py: "1",
  "&:has(input:focus-visible)": {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "text.inverse",
    outlineOffset: "3px",
  },
  tab: {
    minH: "16",
    px: "6",
    py: "2",
  },
});

const icon = css({
  display: "flex",
  color: "text.inverse/90",
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
  fontWeight: "bold",
  color: "text.inverse",
  caretColor: "text.inverse",
  appearance: "none",
  _placeholder: { color: "text.inverse/90", fontWeight: "medium" },
  "&::-webkit-search-cancel-button": { display: "none" },
  "&::-webkit-search-decoration": { display: "none" },
});

const submit = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  flexShrink: "0",
  color: "text.inverse/90",
  fontSize: "xs",
  fontWeight: "bold",
  bg: "transparent",
  borderWidth: "0",
  p: "0",
  cursor: "pointer",
  fontFamily: "sans",
  _focusVisible: {
    outlineWidth: "3px",
    outlineStyle: "solid",
    outlineColor: "primary.600",
    outlineOffset: "3px",
  },
});

/** 右端の丸ボタン。面と同じく透かし、写真の色を少し通す。矢印の白は UI 部品の 3：1 を下限にする。 */
const action = css({
  w: "36px",
  h: "36px",
  borderRadius: "pill",
  bg: "primary.600/72",
  backdropFilter: "blur(3px)",
  color: "text.inverse",
  display: "grid",
  placeItems: "center",
  flexShrink: "0",
  tab: {
    w: "44px",
    h: "44px",
  },
});

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
        <button className={submit} type="submit" aria-label="検索">
          <span className={action} aria-hidden>
            <Icon name="chevron_right" size="sm" />
          </span>
        </button>
      </div>
    </Form>
  );
}
