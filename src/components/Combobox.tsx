"use client";

import { useEffect, useRef, useState, type Ref, type InputHTMLAttributes } from "react";
import { Icon } from "@/components/Icon";
import { Input } from "@/components/Input";
import { css } from "../../styled-system/css";

const rootStyle = css({ position: "relative" });
const inputStyle = css({ pr: "9" });
const indicatorStyle = css({
  position: "absolute",
  right: "3",
  top: "50%",
  transform: "translateY(-50%)",
  color: "text.subtle",
  pointerEvents: "none",
  display: "flex",
  "& svg": { transform: "rotate(90deg)" },
});
const panelStyle = css({
  position: "absolute",
  top: "100%",
  left: "0",
  right: "0",
  mt: "2",
  zIndex: "20",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  boxShadow: "overlay",
  p: "1",
  maxH: "calc(var(--spacing-10) * 6)",
  overflowY: "auto",
});
const optionStyle = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "2",
  w: "full",
  textAlign: "left",
  borderWidth: "0",
  borderRadius: "input",
  px: "3",
  py: "2.5",
  bg: "surface.card",
  color: "text.default",
  fontSize: "sm",
  cursor: "pointer",
  _hover: { bg: "primary.soft" },
  _selected: { bg: "primary.soft", color: "primary.700" },
});
const descriptionStyle = css({ color: "text.subtle", fontSize: "xs", textAlign: "right" });
const emptyStyle = css({ m: "0", px: "3", py: "2.5", color: "text.subtle", fontSize: "sm" });

export type ComboboxOption = { value: string; label: string; description?: string };
type ComboboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "onSelect" | "size" | "type" | "role"
> & {
  id: string;
  ref?: Ref<HTMLInputElement>;
  value: string;
  options: readonly ComboboxOption[];
  onValueChange: (value: string) => void;
  onSelect: (value: string) => void;
  onSubmitValue?: () => void;
  closeOnSubmit?: boolean;
  emptyMessage?: string;
  showEmptyState?: boolean;
};

/** 候補の絞り込みと保存は呼び出し元に任せ、入力と候補選択の操作を共通化する。 */
export function Combobox({
  value,
  options,
  onValueChange,
  onSelect,
  onSubmitValue,
  closeOnSubmit = false,
  showEmptyState = true,
  emptyMessage = "一致する候補がありません。",
  id,
  ref,
  disabled,
  onFocus,
  onKeyDown,
  ...inputProps
}: ComboboxProps) {
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
    // 入力のフォーカスを維持したまま、矢印キーで選んだ行をパネル内に収める。
    if (option.offsetTop < list.current.scrollTop) list.current.scrollTop = option.offsetTop;
    if (
      option.offsetTop + option.offsetHeight >
      list.current.scrollTop + list.current.clientHeight
    ) {
      list.current.scrollTop = option.offsetTop + option.offsetHeight - list.current.clientHeight;
    }
  }, [activeIndex, listId]);

  function select(option: ComboboxOption) {
    onSelect(option.value);
    setOpen(false);
    setActiveIndex(-1);
  }

  return (
    <div
      ref={root}
      className={rootStyle}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <Input
        {...inputProps}
        id={id}
        ref={ref}
        disabled={disabled}
        className={inputStyle}
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
          // 変換確定のEnterを候補選択やフォーム送信に使わない。
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
      <span className={indicatorStyle}>
        <Icon name="chevron_right" size="sm" />
      </span>
      {expanded ? (
        <div
          id={listId}
          ref={list}
          role="listbox"
          aria-label={inputProps["aria-label"]}
          className={panelStyle}
        >
          {options.length === 0 ? (
            <p className={emptyStyle}>{emptyMessage}</p>
          ) : (
            options.map((option, index) => (
              <button
                key={option.value}
                id={`${listId}-${index}`}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={index === activeIndex}
                className={optionStyle}
                onMouseDown={(event) => event.preventDefault()}
                onPointerMove={() => setActiveIndex(index)}
                onClick={() => select(option)}
              >
                <span>{option.label}</span>
                {option.description ? (
                  <span className={descriptionStyle}>{option.description}</span>
                ) : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
