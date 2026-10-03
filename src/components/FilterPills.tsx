"use client";

import { cva, css, cx } from "../../styled-system/css";

const row = css({
  display: "flex",
  gap: "1.5",
  overflowX: "auto",
  pb: "1",
});

const pillRecipe = cva({
  base: {
    flexShrink: "0",
    fontSize: "sm",
    px: "3",
    py: "1.5",
    borderRadius: "pill",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.strong",
    bg: "surface.card",
    color: "text.muted",
    cursor: "pointer",
    fontFamily: "sans",
  },
  variants: {
    active: {
      true: {
        bg: "primary.700",
        borderColor: "primary.600",
        color: "surface.card",
        fontWeight: "600",
      },
      false: {},
    },
  },
  defaultVariants: {
    active: false,
  },
});

export type FilterPillOption = {
  value: string;
  label: string;
};

type FilterPillsProps = {
  options: FilterPillOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  "aria-label"?: string;
};

/** 記事一覧のフィルタピル（fpill）。 */
export function FilterPills({
  options,
  value,
  onChange,
  className,
  "aria-label": ariaLabel = "フィルタ",
}: FilterPillsProps) {
  return (
    <div
      className={cx(css({ overflowX: "auto" }), className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      <div className={row}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={active}
              className={pillRecipe({ active })}
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
