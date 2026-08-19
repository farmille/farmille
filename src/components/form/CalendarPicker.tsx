"use client";

import { useMemo, useState } from "react";

import { cva, css } from "../../../styled-system/css";

const calendar = css({
  mt: "2.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "button",
  p: "3",
  bg: "surface.card",
});

const calendarHeader = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  mb: "2.5",
});

const navigationButton = css({
  borderWidth: "0",
  bg: "surface.page",
  borderRadius: "button",
  w: "32px",
  h: "32px",
  color: "text.muted",
  fontSize: "xl",
  cursor: "pointer",
});

const monthLabel = css({
  fontSize: "md",
  fontWeight: "700",
  fontVariantNumeric: "tabular-nums",
});

const calendarGrid = css({
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: "0.5",
});

const dayOfWeek = css({
  py: "0.5",
  textAlign: "center",
  fontSize: "xs",
  color: "text.subtle",
});

const dayButton = cva({
  base: {
    aspectRatio: "1",
    display: "grid",
    placeItems: "center",
    borderWidth: "0",
    borderRadius: "button",
    fontSize: "sm",
    fontVariantNumeric: "tabular-nums",
    cursor: "pointer",
  },
  variants: {
    selected: {
      true: {
        bg: "brand.primary",
        color: "surface.card",
        fontWeight: "700",
      },
      false: {
        bg: "transparent",
        color: "text.default",
        _hover: { bg: "brand.soft" },
      },
    },
  },
});

const emptyDay = css({ aspectRatio: "1", visibility: "hidden" });

const chips = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "1.5",
  minH: "28px",
  alignItems: "center",
});

const dateChip = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  bg: "brand.soft",
  color: "brand.primaryDeep",
  borderRadius: "pill",
  px: "2.5",
  py: "1",
  fontSize: "sm",
  fontWeight: "600",
});

const removeButton = css({
  borderWidth: "0",
  bg: "transparent",
  color: "inherit",
  p: "0",
  cursor: "pointer",
  fontSize: "md",
  lineHeight: "1",
});

const emptyMessage = css({ fontSize: "sm", color: "text.subtle" });

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

function monthParts(value: string): { year: number; month: number } {
  const [year, month] = value.split("-").map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("カレンダーの初期月が不正です。");
  }
  return { year, month };
}

function monthValue(year: number, month: number): string {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}`;
}

function dateValue(year: number, month: number, day: number): string {
  return `${monthValue(year, month)}-${day.toString().padStart(2, "0")}`;
}

function dateLabel(value: string, suffix: string): string {
  const [, month, day] = value.split("-").map(Number);
  return `${month}/${day}${suffix}`;
}

export function CalendarPicker({
  value,
  onChange,
  initialMonth,
  emptyMessage: emptyText,
  single = false,
  suffix = "",
  ariaLabel,
}: {
  value: readonly string[];
  onChange: (value: string[]) => void;
  initialMonth: string;
  emptyMessage: string;
  single?: boolean;
  suffix?: string;
  ariaLabel: string;
}) {
  const selected = useMemo(() => new Set(value), [value]);
  const [visibleMonth, setVisibleMonth] = useState(value[0]?.slice(0, 7) ?? initialMonth);
  const { year, month } = monthParts(visibleMonth);

  const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: Array<number | null> = [
    ...Array.from<null>({ length: firstDay }).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  function moveMonth(offset: number): void {
    const next = new Date(Date.UTC(year, month - 1 + offset, 1));
    setVisibleMonth(monthValue(next.getUTCFullYear(), next.getUTCMonth() + 1));
  }

  function toggleDate(date: string): void {
    if (single) {
      onChange(selected.has(date) ? [] : [date]);
      return;
    }
    const next = new Set(selected);
    if (next.has(date)) next.delete(date);
    else next.add(date);
    onChange([...next].toSorted());
  }

  return (
    <>
      <div className={chips} aria-live="polite">
        {value.length > 0 ? (
          value.toSorted().map((date) => (
            <span key={date} className={dateChip}>
              {dateLabel(date, suffix)}
              <button
                type="button"
                className={removeButton}
                aria-label={`${dateLabel(date, suffix)}を削除`}
                onClick={() => onChange(value.filter((candidate) => candidate !== date))}
              >
                ×
              </button>
            </span>
          ))
        ) : (
          <span className={emptyMessage}>{emptyText}</span>
        )}
      </div>
      <div className={calendar} aria-label={ariaLabel}>
        <div className={calendarHeader}>
          <button
            type="button"
            className={navigationButton}
            aria-label="前の月"
            onClick={() => moveMonth(-1)}
          >
            ‹
          </button>
          <span className={monthLabel}>
            {year}年 {month}月
          </span>
          <button
            type="button"
            className={navigationButton}
            aria-label="次の月"
            onClick={() => moveMonth(1)}
          >
            ›
          </button>
        </div>
        <div className={calendarGrid}>
          {WEEKDAYS.map((day) => (
            <div key={day} className={dayOfWeek}>
              {day}
            </div>
          ))}
          {cells.map((day, index) =>
            day === null ? (
              <span key={`empty-${index}`} className={emptyDay} aria-hidden />
            ) : (
              <button
                key={day}
                type="button"
                className={dayButton({
                  selected: selected.has(dateValue(year, month, day)),
                })}
                aria-pressed={selected.has(dateValue(year, month, day))}
                onClick={() => toggleDate(dateValue(year, month, day))}
              >
                {day}
              </button>
            ),
          )}
        </div>
      </div>
    </>
  );
}
