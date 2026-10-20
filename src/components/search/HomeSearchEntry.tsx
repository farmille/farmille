import Form from "next/form";

import { SearchInput } from "@/components/form";
import { css } from "../../../styled-system/css";

const entry = css({
  display: "block",
  w: "full",
  m: "0",
  // ヒーローのゴシックMB101（weight 300 のみ）を継承すると太字が合成されるため本文書体に戻す
  fontFamily: "sans",
});

export function HomeSearchEntry() {
  return (
    <Form action="/search" aria-label="資材検索" className={entry} role="search">
      <SearchInput
        aria-label="資材を検索する。作物、悩み、資材名から探せます"
        name="q"
        placeholder="作物・悩み・資材名から探す"
        size="lg"
        submitLabel="検索"
        surface="glass"
      />
    </Form>
  );
}
