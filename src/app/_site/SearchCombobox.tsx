"use client";

import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";

import { css, cva } from "../../../styled-system/css";

import { SearchIcon } from "./FormParts";

const root = css({ position: "relative" });

const box = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  px: "3",
  py: "2.5",
  bg: "surface.card",
  borderWidth: "1.5px",
  borderStyle: "solid",
  borderColor: "border.strong",
  borderRadius: "button",
  _focusWithin: {
    borderColor: "primary.700",
    boxShadow: "0 0 0 3px color-mix(in srgb, token(colors.primary.700) 16%, transparent)",
  },
});

const icon = css({ display: "flex", color: "text.subtle" });

const field = css({
  flex: "1",
  minW: "0",
  border: "none",
  outline: "none",
  bg: "transparent",
  color: "text.default",
  fontSize: "md",
  _placeholder: { color: "text.subtle" },
  _disabled: { cursor: "not-allowed" },
});

const panel = css({
  mt: "2.5",
  maxH: "72",
  overflowY: "auto",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "button",
  boxShadow: "shadow",
});

const empty = css({ p: "3.5", textAlign: "center", color: "text.subtle", fontSize: "sm" });

const optionGroup = css({ px: "3", py: "3" });

const optionRecipe = cva({
  base: {
    display: "flex",
    alignItems: "center",
    gap: "2",
    w: "100%",
    px: "1.5",
    py: "2",
    border: "0",
    borderRadius: "input",
    bg: "transparent",
    color: "inherit",
    fontSize: "md",
    textAlign: "left",
    _hover: { bg: "primary.soft" },
  },
  variants: {
    active: { true: { bg: "primary.soft" }, false: {} },
  },
});

const optionCategory = css({
  px: "1.5",
  py: "0.5",
  borderRadius: "mark",
  bg: "text.subtle/15",
  color: "text.muted",
  fontSize: "xs",
  fontWeight: "bold",
  whiteSpace: "nowrap",
});

export type SearchComboboxOption = { value: string; label: string; description?: string };

type SearchComboboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "onSelect" | "size" | "type" | "role" | "className"
> & {
  id: string;
  value: string;
  options: readonly SearchComboboxOption[];
  onValueChange: (value: string) => void;
  onSelect: (value: string) => void;
  onSubmitValue?: () => void;
  closeOnSubmit?: boolean;
  emptyMessage?: string;
  showEmptyState?: boolean;
};

/**
 * 検索欄つきの候補ピッカーを、共通の Combobox（src/components/Combobox.tsx）と同じキーボード操作で動かすもの。
 * 候補の絞り込みと保存は呼び出し元に任せる。
 */
export function SearchCombobox({
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
}: SearchComboboxProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const expanded = open && !disabled && (showEmptyState || options.length > 0);
  const listId = `${id}-options`;
  const activeOption = options[activeIndex];

  useEffect(() => {
    if (!expanded) return;
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
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

  function select(option: SearchComboboxOption) {
    onSelect(option.value);
    setOpen(false);
    setActiveIndex(-1);
  }

  return (
    <div
      ref={rootRef}
      className={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <div className={box}>
        <span className={icon}>
          <SearchIcon />
        </span>
        <input
          {...inputProps}
          id={id}
          disabled={disabled}
          className={field}
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
          className={panel}
        >
          {options.length === 0 ? (
            <div className={empty}>{emptyMessage}</div>
          ) : (
            <div className={optionGroup}>
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
                  className={optionRecipe({ active: index === activeIndex })}
                  onMouseDown={(event) => event.preventDefault()}
                  onPointerMove={() => setActiveIndex(index)}
                  onClick={() => select(option)}
                >
                  {option.description ? (
                    <span className={optionCategory}>{option.description}</span>
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
