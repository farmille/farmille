import type { ReactNode } from "react";

import { reportPlotColor } from "@/components/ReportPlotColor";

import { css, cx } from "../../../../styled-system/css";

export type ReportBarRow = {
  id: string;
  label: string;
  valueText: string;
  value: number;
  error: number | null;
  colorIndex: number;
};

function domain(rows: ReportBarRow[], unit: string) {
  const min = Math.min(0, ...rows.map((row) => row.value - (row.error ?? 0)));
  const max = Math.max(unit === "%" ? 100 : 0, ...rows.map((row) => row.value + (row.error ?? 0)));
  return { min, max: max === min ? min + 1 : max };
}

const whisker = {
  content: '""',
  position: "absolute",
  top: "-1.5",
  h: "3",
  borderLeftWidth: "1.5px",
  borderLeftStyle: "solid",
  borderLeftColor: "text.muted",
} as const;

const errorStyle = css({
  position: "absolute",
  top: "50%",
  left: "var(--error-start)",
  w: "var(--error-width)",
  h: "0",
  borderTopWidth: "1.5px",
  borderTopStyle: "solid",
  borderTopColor: "text.muted",
  _before: { ...whisker, left: "0" },
  _after: { ...whisker, right: "0" },
});

export function ReportBars({
  title,
  unit,
  rows,
}: {
  title: string;
  unit: string;
  rows: ReportBarRow[];
}) {
  const { min, max } = domain(rows, unit);
  const position = (value: number) => ((value - min) / (max - min)) * 100;
  return (
    <figure
      className={css({
        m: "0",
        mt: "3",
        p: "3.5",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border.default",
        borderRadius: "card",
        bg: "surface.card",
        "figure + &": { mt: "2.5" },
      })}
    >
      <figcaption className={css({ fontSize: "sm", fontWeight: "extrabold" })}>
        {title}
        {unit ? (
          <span className={css({ fontWeight: "normal", color: "text.subtle" })}>（{unit}）</span>
        ) : null}
      </figcaption>
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "1.5",
          mt: "2",
          maxW: "96",
        })}
      >
        {rows.map((row) => {
          const zero = position(0);
          const end = position(row.value);
          return (
            <div
              key={row.id}
              className={css({
                display: "grid",
                gridTemplateColumns: "minmax(0, token(sizes.reportGraph.plot)) minmax(0, 1fr) auto",
                alignItems: "center",
                gap: "2",
                fontSize: "sm",
              })}
              role="img"
              aria-label={`${row.label} ${row.valueText}${unit ? ` ${unit}` : ""}`}
            >
              <span
                className={css({
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                })}
              >
                {row.label}
              </span>
              <span
                className={css({ position: "relative", display: "block", h: "4" })}
                aria-hidden="true"
              >
                <i
                  className={cx(
                    css({
                      position: "absolute",
                      top: "0",
                      bottom: "0",
                      display: "block",
                      left: "var(--bar-start)",
                      w: "var(--bar-width)",
                      borderRadius: "bar",
                      bg: "currentColor",
                    }),
                    reportPlotColor(row.colorIndex),
                  )}
                  style={{
                    "--bar-start": `${Math.min(zero, end)}%`,
                    "--bar-width": `${Math.abs(end - zero)}%`,
                  }}
                />
                {row.error !== null ? (
                  <span
                    className={errorStyle}
                    style={{
                      "--error-start": `${position(row.value - row.error)}%`,
                      "--error-width": `${position(row.value + row.error) - position(row.value - row.error)}%`,
                    }}
                  />
                ) : null}
              </span>
              <b
                className={css({
                  textAlign: "right",
                  whiteSpace: "nowrap",
                  fontVariantNumeric: "tabular-nums",
                })}
                aria-hidden="true"
              >
                {row.valueText}
              </b>
            </div>
          );
        })}
      </div>
    </figure>
  );
}

export function ReportGraphNote({ children }: { children: ReactNode }) {
  return (
    <div
      className={css({
        display: "flex",
        alignItems: "center",
        gap: "1.5",
        mt: "3",
        pt: "2.5",
        borderTopWidth: "1px",
        borderTopStyle: "solid",
        borderTopColor: "border.default",
        textStyle: "note",
        color: "text.subtle",
      })}
    >
      {children}
    </div>
  );
}
