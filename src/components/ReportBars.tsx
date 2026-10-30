import type { ReactNode } from "react";

import { reportPlotColor } from "@/components/ReportPlotColor";
import { parseReportNumber } from "@/lib/usage-report";
import type {
  ReportGraphSection,
  ReportPlotLayout,
  ReportPlotSeries,
} from "@/lib/usage-report-plots";

import { css, cx } from "../../styled-system/css";

export type ReportBarRow = {
  id: string;
  label: string;
  valueText: string;
  value: number;
  error: number | null;
  series: ReportPlotSeries;
};

/** 棒の並び。heading は品種ごとにまとめるときの品種名。 */
export type ReportBarGroup = { key: string; heading: string | null; rows: ReportBarRow[] };

/** グラフの節を棒の並びにする。数値として読めない値の行は棒にしない。 */
export function reportBarGroups(sections: ReportGraphSection[]): ReportBarGroup[] {
  return sections.flatMap(({ key, heading, rows }) => {
    const bars = rows.flatMap(({ id, label, value, series }) => {
      const parsed = parseReportNumber(value);

      return parsed === null
        ? []
        : [
            {
              id,
              label,
              valueText: value.trim(),
              value: parsed.value,
              error: parsed.error,
              series,
            },
          ];
    });

    return bars.length === 0 ? [] : [{ key, heading, rows: bars }];
  });
}

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
  top: "[50%]",
  left: "var(--error-start)",
  w: "var(--error-width)",
  h: "0",
  borderTopWidth: "1.5px",
  borderTopStyle: "solid",
  borderTopColor: "text.muted",
  _before: { ...whisker, left: "0" },
  _after: { ...whisker, right: "0" },
});

const swatch = css({ flex: "none", w: "2.5", h: "2.5", borderRadius: "bar", bg: "currentColor" });

export function ReportBars({
  title,
  unit,
  groups,
  legend = null,
}: {
  title: string;
  unit: string;
  groups: ReportBarGroup[];
  legend?: ReportPlotLayout["legend"];
}) {
  const { min, max } = domain(
    groups.flatMap(({ rows }) => rows),
    unit,
  );

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
      {legend === null ? null : (
        <ul
          className={css({
            display: "flex",
            flexWrap: "wrap",
            columnGap: "3",
            rowGap: "1",
            m: "0",
            mt: "2",
            p: "0",
            listStyle: "none",
            textStyle: "note",
            color: "text.muted",
          })}
          aria-label="使った資材の色"
        >
          {legend.map((item) => (
            <li key={item.key} className={css({ display: "flex", alignItems: "center", gap: "1" })}>
              <span className={cx(swatch, reportPlotColor({ series: item.series }))} />
              {item.label}
            </li>
          ))}
        </ul>
      )}
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "1.5",
          mt: "2",
          maxW: "96",
        })}
      >
        {groups.map((group) => (
          <div
            key={group.key}
            className={css({ display: "flex", flexDirection: "column", gap: "1.5" })}
          >
            {group.heading === null ? null : (
              <div className={css({ mt: "1.5", fontSize: "sm", fontWeight: "bold" })}>
                品種：{group.heading || "（品種名未入力）"}
              </div>
            )}
            {group.rows.map((row) => {
              const zero = position(0);
              const end = position(row.value);

              return (
                <div
                  key={row.id}
                  className={css({
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(0, token(sizes.reportGraph.plot)) minmax(0, 1fr) auto",
                    alignItems: "center",
                    gap: "2",
                    fontSize: "sm",
                  })}
                  role="img"
                  aria-label={`${group.heading ? `${group.heading} ` : ""}${row.label} ${row.valueText}${unit ? ` ${unit}` : ""}`}
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
                        reportPlotColor({ series: row.series }),
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
        ))}
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
