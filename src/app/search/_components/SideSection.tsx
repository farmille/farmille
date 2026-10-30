"use client";

import { Fragment, useContext, useReducer, type ReactNode } from "react";

import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/Collapsible";
import { Input } from "@/components/form";
import { css } from "../../../../styled-system/css";

import { chipListStyle } from "./search-chips";
import { FilterFocusContext } from "./filter-focus";

export type SideFilterItem = {
  key: string;
  terms: string[];
  node: ReactNode;
};

function normalize(value: string) {
  return value.normalize("NFKC").toLowerCase();
}

const filterInputStyle = css({ mb: "2" });

// 区分の見出しを詰めて並べ、スマホでも検索結果を最初の画面に近づける
const triggerStyle = css({ minH: "10", py: "1" });

const titleStyle = css({ display: "flex", flexDirection: "column", minW: "0" });

const hintStyle = css({ textStyle: "supporting", fontWeight: "normal", color: "text.muted" });

export function SideSection({
  sectionKey,
  title,
  hint,
  note,
  selected,
  filter,
  children,
}: {
  /** スマホのシートで、区分のチップから開いたときにこの区分を開いた状態で出すための名前。 */
  sectionKey?: string;
  title: string;
  /** 区分の中身が何かを、実際の項目名を使った例で添える短い説明。 */
  hint?: string;
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
  const focus = useContext(FilterFocusContext);
  const [query, setQuery] = useReducer((_query: string, next: string) => next, "");
  const keyword = normalize(query.trim());
  const hits =
    filter && keyword
      ? filter.items.filter((item) => item.terms.some((term) => normalize(term).includes(keyword)))
      : null;

  return (
    <Collapsible
      defaultOpen={sectionKey !== undefined && focus === sectionKey}
      className={css({
        py: "0.5",
        px: "3",
        "& + &": {
          borderTopWidth: "1px",
          borderTopStyle: "solid",
          borderTopColor: "border.default",
        },
      })}
    >
      <CollapsibleTrigger className={triggerStyle}>
        <span className={titleStyle}>
          {title}
          {hint === undefined ? null : <span className={hintStyle}>{hint}</span>}
        </span>
      </CollapsibleTrigger>
      {selected}
      <CollapsiblePanel hiddenUntilFound motion="none">
        {filter ? (
          <Input
            type="search"
            size="sm"
            className={filterInputStyle}
            hideLabel
            label={filter.label}
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
                  textStyle: "note",
                })}
              >
                {filter?.empty}
              </span>
            )}
          </div>
        ) : null}
        <div hidden={hits !== null}>{children}</div>
      </CollapsiblePanel>
    </Collapsible>
  );
}
