"use client";

import { Fragment, useState, type ReactNode } from "react";

import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/Collapsible";
import { Input } from "@/components/form";
import { css } from "../../../../styled-system/css";

import { chipListStyle } from "./search-chips";

export type SideFilterItem = {
  key: string;
  terms: string[];
  node: ReactNode;
};

function normalize(value: string) {
  return value.normalize("NFKC").toLowerCase();
}

const filterInputStyle = css({ mb: "2" });

export function SideSection({
  title,
  note,
  selected,
  filter,
  children,
}: {
  title: string;
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
  const [query, setQuery] = useState("");
  const keyword = normalize(query.trim());
  const hits =
    filter && keyword
      ? filter.items.filter((item) => item.terms.some((term) => normalize(term).includes(keyword)))
      : null;

  return (
    <Collapsible
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
      <CollapsibleTrigger>{title}</CollapsibleTrigger>
      {filter ? (
        <Input
          type="search"
          size="sm"
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
      <CollapsiblePanel hiddenUntilFound motion="none">
        <div hidden={hits !== null}>{children}</div>
      </CollapsiblePanel>
    </Collapsible>
  );
}
