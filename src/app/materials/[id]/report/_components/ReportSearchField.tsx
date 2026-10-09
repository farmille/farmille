"use client";

import { useId, useState } from "react";

import { inputRecipe } from "@/components/Input";
import { css } from "../../../../../../styled-system/css";

export type ReportSearchItem = {
  value: string;
  label: string;
  name: string;
  category?: string;
  note?: string;
};

const root = css({ position: "relative", mt: "2" });

const list = css({
  position: "absolute",
  top: "calc(100% + {spacing.1})",
  left: "0",
  right: "0",
  zIndex: "6",
  maxH: "72",
  overflow: "auto",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  bg: "surface.card",
  boxShadow: "shadow.lift",
});

const option = css({
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  px: "3",
  py: "2",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
  cursor: "pointer",
  _last: { borderBottomWidth: "0" },
  _hover: { bg: "primary.soft" },
  _selected: { bg: "primary.soft" },
});

const category = css({
  flex: "0 0 auto",
  borderRadius: "mark",
  bg: "surface.panel",
  px: "1.5",
  fontSize: "xs",
  color: "text.subtle",
  whiteSpace: "nowrap",
});

const name = css({ fontWeight: "bold" });

const note = css({ ml: "auto", fontSize: "xs", color: "text.subtle", whiteSpace: "nowrap" });

const empty = css({ px: "3", py: "2.5", fontSize: "sm", color: "text.subtle" });

export function ReportSearchField({
  ariaLabel,
  placeholder,
  value,
  onValueChange,
  items,
  emptyMessage,
  onSelect,
}: {
  ariaLabel: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  items: ReportSearchItem[];
  emptyMessage: string;
  onSelect: (value: string) => void;
}) {
  const listId = useId();
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const shown = open && value.trim().length > 0;
  const activeItem = items[Math.min(active, items.length - 1)];
  function choose(item: ReportSearchItem) {
    onSelect(item.value);
    setOpen(false);
  }
  return (
    <div className={root}>
      <input
        className={inputRecipe()}
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={shown}
        aria-controls={shown ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={shown && activeItem ? `${listId}-${activeItem.value}` : undefined}
        placeholder={placeholder}
        autoComplete="off"
        value={value}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          onValueChange(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const step = event.key === "ArrowDown" ? 1 : -1;
            setActive((current) => Math.max(0, Math.min(items.length - 1, current + step)));
          } else if (event.key === "Enter" && shown) {
            event.preventDefault();
            if (activeItem) choose(activeItem);
          } else if (event.key === "Escape") setOpen(false);
        }}
      />
      {shown ? (
        <div id={listId} role="listbox" aria-label={ariaLabel} className={list}>
          {items.length === 0 && <div className={empty}>{emptyMessage}</div>}
          {items.map((item) => (
            <div
              key={item.value}
              id={`${listId}-${item.value}`}
              role="option"
              aria-label={item.label}
              aria-selected={item === activeItem}
              className={option}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(item)}
            >
              {item.category && <span className={category}>{item.category}</span>}
              <span className={name}>{item.name}</span>
              {item.note && <span className={note}>{item.note}</span>}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
