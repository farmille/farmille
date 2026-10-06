import { reportPlotColor } from "@/components/ReportPlotColor";

export type ReportBarRow = {
  id: string;
  label: string;
  /** 投稿された値の原文（誤差・有意差記号を含む）。棒の右に出す。 */
  valueText: string;
  value: number;
  error: number | null;
  /** 区の並び順。入力のグラフ・区カードと同じ色にする。 */
  colorIndex: number;
};

/** 0 と各値（誤差込み）が収まる範囲。% は 100 を上限の下限にする。 */
function domain(rows: ReportBarRow[], unit: string) {
  const min = Math.min(0, ...rows.map((row) => row.value - (row.error ?? 0)));
  const max = Math.max(unit === "%" ? 100 : 0, ...rows.map((row) => row.value + (row.error ?? 0)));
  return { min, max: max === min ? min + 1 : max };
}

/**
 * 見本 S.reportArticle の横棒グラフ（`.hgraph` の `.bars .bar`）。
 * 棒は先頭の数値、ひげは±の誤差。値の列には原文をそのまま出す。
 */
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
    <figure className="hgraph" style={{ margin: 0, marginTop: 12 }}>
      <figcaption className="hgraph-title">
        {title}
        {unit ? (
          <span className="muted" style={{ fontWeight: 400 }}>
            （{unit}）
          </span>
        ) : null}
      </figcaption>
      <div className="bars rp-bars">
        {rows.map((row) => {
          const zero = position(0);
          const end = position(row.value);
          return (
            <div
              key={row.id}
              className="bar"
              role="img"
              aria-label={`${row.label} ${row.valueText}${unit ? ` ${unit}` : ""}`}
            >
              <span>{row.label}</span>
              <span className="rp-track" aria-hidden="true">
                <i
                  className={`plot-color ${reportPlotColor(row.colorIndex)}`}
                  style={{ left: `${Math.min(zero, end)}%`, width: `${Math.abs(end - zero)}%` }}
                />
                {row.error !== null ? (
                  <span
                    className="rp-err"
                    style={{
                      left: `${position(row.value - row.error)}%`,
                      width: `${position(row.value + row.error) - position(row.value - row.error)}%`,
                    }}
                  />
                ) : null}
              </span>
              <b aria-hidden="true">{row.valueText}</b>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
