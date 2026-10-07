"use client";

import { Fragment, useId, useState, type ReactNode } from "react";

import { inputRecipe } from "@/components/Input";
import { css } from "../../../../styled-system/css";

import { chipListStyle, focusRing } from "./search-chips";

/** 絞り込み欄の文字検索で探す対象。`terms` は名前と別名。 */
export type SideFilterItem = {
  key: string;
  terms: string[];
  node: ReactNode;
};

function normalize(value: string) {
  return value.normalize("NFKC").toLowerCase();
}

const headerButtonStyle = css(focusRing, {
  display: "flex",
  alignItems: "center",
  gap: "2",
  w: "full",
  minH: "11",
  py: "1.5",
  px: "0.5",
  borderWidth: "0",
  bg: "transparent",
  color: "inherit",
  fontFamily: "inherit",
  textAlign: "left",
  cursor: "pointer",
});

const filterInputStyle = css(inputRecipe.raw(), {
  mb: "2",
  py: "2",
  px: "3",
  fontFamily: "inherit",
  fontSize: "sm",
});

/**
 * 絞り込みパネルの1区分。
 * 見出し行で開閉し、見出しのすぐ下に文字検索の欄と選択中の条件を常に出す。
 * 文字検索に入力があるあいだは、一覧の代わりに一致した候補だけを並べる。
 */
export function SideSection({
  title,
  note,
  selected,
  filter,
  children,
}: {
  title: string;
  /** 文字検索の欄の下に常に出す説明 */
  note?: string;
  selected?: ReactNode;
  filter?: {
    label: string;
    placeholder: string;
    empty: string;
    items: SideFilterItem[];
  };
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const bodyId = useId();
  const keyword = normalize(query.trim());
  const hits =
    filter && keyword
      ? filter.items.filter((item) => item.terms.some((term) => normalize(term).includes(keyword)))
      : null;

  return (
    <div
      className={css({
        py: "2",
        px: "3",
        "& + &": {
          borderTopWidth: "1px",
          borderTopStyle: "solid",
          borderTopColor: "border.default",
        },
      })}
    >
      <button
        type="button"
        className={headerButtonStyle}
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(!open)}
      >
        <span className={css({ fontSize: "md", fontWeight: "bold" })}>{title}</span>
        <span
          className={css({
            flex: "none",
            ml: "auto",
            color: "primary.700",
            fontSize: "xs",
            fontWeight: "bold",
          })}
          aria-hidden="true"
        >
          {open ? "閉じる ▴" : "開く ▾"}
        </span>
      </button>
      {filter ? (
        <input
          type="search"
          className={filterInputStyle}
          aria-label={filter.label}
          placeholder={filter.placeholder}
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      ) : null}
      {note ? (
        <div
          className={css({
            mt: "0.5",
            mb: "1.5",
            color: "text.muted",
            fontSize: "sm",
            lineHeight: "normal",
          })}
        >
          {note}
        </div>
      ) : null}
      {selected}
      {hits ? (
        <div className={chipListStyle}>
          {hits.length > 0 ? (
            hits.map((item) => <Fragment key={item.key}>{item.node}</Fragment>)
          ) : (
            <span
              className={css({
                display: "inline-flex",
                alignItems: "center",
                gap: "1.5",
                py: "0.5",
                px: "2.5",
                bg: "surface.page",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "border.default",
                borderRadius: "pill",
                color: "text.subtle",
                fontSize: "xs",
              })}
            >
              {filter?.empty}
            </span>
          )}
        </div>
      ) : null}
      <div id={bodyId} hidden={!open || hits !== null}>
        {children}
      </div>
    </div>
  );
}
