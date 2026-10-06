"use client";

import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";

import { SearchIcon } from "./FormParts";

export type MockComboboxOption = { value: string; label: string; description?: string };

type MockComboboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "onSelect" | "size" | "type" | "role" | "className"
> & {
  id: string;
  value: string;
  options: readonly MockComboboxOption[];
  onValueChange: (value: string) => void;
  onSelect: (value: string) => void;
  onSubmitValue?: () => void;
  closeOnSubmit?: boolean;
  emptyMessage?: string;
  showEmptyState?: boolean;
};

/**
 * 見本の検索ピッカー（`.ts-box` の入力＋ `.ts-panel` の候補）を、
 * 共通の Combobox（src/components/Combobox.tsx）と同じキーボード操作で動かすもの。
 * 候補の絞り込みと保存は呼び出し元に任せる。
 */
export function MockCombobox({
  value,
  options,
  onValueChange,
  onSelect,
  onSubmitValue,
  closeOnSubmit = false,
  showEmptyState = true,
  emptyMessage = "一致する候補がありません。",
  id,
  disabled,
  onFocus,
  onKeyDown,
  ...inputProps
}: MockComboboxProps) {
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const expanded = open && !disabled && (showEmptyState || options.length > 0);
  const listId = `${id}-options`;
  const activeOption = options[activeIndex];

  useEffect(() => {
    if (!expanded) return;
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [expanded]);

  useEffect(() => {
    const option = list.current?.querySelector<HTMLElement>(`[id="${listId}-${activeIndex}"]`);
    if (!option || !list.current) return;
    if (option.offsetTop < list.current.scrollTop) list.current.scrollTop = option.offsetTop;
    if (
      option.offsetTop + option.offsetHeight >
      list.current.scrollTop + list.current.clientHeight
    ) {
      list.current.scrollTop = option.offsetTop + option.offsetHeight - list.current.clientHeight;
    }
  }, [activeIndex, listId]);

  function select(option: MockComboboxOption) {
    onSelect(option.value);
    setOpen(false);
    setActiveIndex(-1);
  }

  return (
    <div
      ref={root}
      className="ts-combobox"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <div className="ts-box">
        <span className="ts-ic">
          <SearchIcon />
        </span>
        <input
          {...inputProps}
          id={id}
          disabled={disabled}
          className="ts-input"
          type="text"
          role="combobox"
          value={value}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded ? listId : undefined}
          aria-activedescendant={expanded && activeOption ? `${listId}-${activeIndex}` : undefined}
          onFocus={(event) => {
            setOpen(true);
            onFocus?.(event);
          }}
          onClick={() => setOpen(true)}
          onChange={(event) => {
            onValueChange(event.target.value);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            // 変換確定の Enter を候補選択やフォーム送信に使わない。
            if (event.nativeEvent.isComposing || event.keyCode === 229) return;
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              const direction = event.key === "ArrowDown" ? 1 : -1;
              setActiveIndex((current) =>
                options.length === 0
                  ? -1
                  : current < 0
                    ? direction === 1
                      ? 0
                      : options.length - 1
                    : (current + direction + options.length) % options.length,
              );
            } else if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
              setActiveIndex(-1);
            } else if (event.key === "Enter" && expanded && activeOption) {
              event.preventDefault();
              select(activeOption);
            } else if (event.key === "Enter" && onSubmitValue) {
              event.preventDefault();
              onSubmitValue();
              if (closeOnSubmit) setOpen(false);
              setActiveIndex(-1);
            } else if (event.key === "Enter" && !onKeyDown) {
              event.preventDefault();
            } else {
              onKeyDown?.(event);
            }
          }}
        />
      </div>
      {expanded ? (
        <div
          id={listId}
          ref={list}
          role="listbox"
          aria-label={inputProps["aria-label"]}
          className="ts-panel ts-panel-float"
        >
          {options.length === 0 ? (
            <div className="ts-empty">{emptyMessage}</div>
          ) : (
            <div className="ts-pg">
              {options.map((option, index) => (
                <button
                  key={option.value}
                  id={`${listId}-${index}`}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={index === activeIndex}
                  aria-label={
                    option.description ? `${option.label} ${option.description}` : option.label
                  }
                  className={index === activeIndex ? "sug active" : "sug"}
                  onMouseDown={(event) => event.preventDefault()}
                  onPointerMove={() => setActiveIndex(index)}
                  onClick={() => select(option)}
                >
                  {option.description ? (
                    <span className="cat-label">{option.description}</span>
                  ) : null}
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
