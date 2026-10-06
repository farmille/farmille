"use client";

import { useId, useState, type ReactNode } from "react";

export type MockSearchItem = {
  value: string;
  /** 読み上げ名。見た目の並び（分類→名前）と違う順で読ませたいときに使う */
  label: string;
  content: ReactNode;
};

/**
 * 見本の `.search` ＋ `.drop`（入力しながら候補が出る検索欄）。
 * 見た目は見本のクラスのまま、入力欄は combobox、候補は listbox/option として読み上げる。
 */
export function MockSearch({
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
  items: MockSearchItem[];
  emptyMessage: string;
  onSelect: (value: string) => void;
}) {
  const listId = useId();
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const shown = open && value.trim().length > 0;
  const activeItem = items[Math.min(active, items.length - 1)];
  function choose(item: MockSearchItem) {
    onSelect(item.value);
    setOpen(false);
  }
  return (
    <div className="search">
      <input
        className="input"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={shown}
        aria-controls={listId}
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
          } else if (event.key === "Enter" && shown && activeItem) {
            event.preventDefault();
            choose(activeItem);
          } else if (event.key === "Escape") setOpen(false);
        }}
      />
      <div id={listId} role="listbox" aria-label={ariaLabel} className={shown ? "drop on" : "drop"}>
        {shown && items.length === 0 && <div className="none">{emptyMessage}</div>}
        {shown &&
          items.map((item) => (
            <div
              key={item.value}
              id={`${listId}-${item.value}`}
              role="option"
              aria-label={item.label}
              aria-selected={item === activeItem}
              className="it"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(item)}
            >
              {item.content}
            </div>
          ))}
      </div>
    </div>
  );
}
