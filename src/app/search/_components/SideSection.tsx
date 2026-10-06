"use client";

import { Fragment, useId, useState, type ReactNode } from "react";

/** 絞り込み欄の文字検索で探す対象。`terms` は名前と別名。 */
export type SideFilterItem = {
  key: string;
  terms: string[];
  node: ReactNode;
};

function normalize(value: string) {
  return value.normalize("NFKC").toLowerCase();
}

/**
 * 見本 S.search の絞り込みパネルの1区分（`sec()`）。
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
    <div className="ts-pg side-sec">
      <button
        type="button"
        className="sec-head"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(!open)}
      >
        <span className="sec-title">{title}</span>
        <span className="caret" aria-hidden="true" />
      </button>
      {filter ? (
        <input
          type="search"
          className="input side-filter"
          aria-label={filter.label}
          placeholder={filter.placeholder}
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      ) : null}
      {note ? (
        <div className="fguide" style={{ margin: "2px 0 6px" }}>
          {note}
        </div>
      ) : null}
      {selected}
      {hits ? (
        <div className="sug-chips">
          {hits.length > 0 ? (
            hits.map((item) => <Fragment key={item.key}>{item.node}</Fragment>)
          ) : (
            <span className="hint-pill">{filter?.empty}</span>
          )}
        </div>
      ) : null}
      <div id={bodyId} hidden={!open || hits !== null} className="sec-body">
        {children}
      </div>
    </div>
  );
}
