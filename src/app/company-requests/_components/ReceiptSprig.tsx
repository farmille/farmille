import { css, cx } from "../../../../styled-system/css";

// 茎は3次ベジェ曲線。葉は [付け根の x, y, 向き（真上を0度、時計回り）, 長さ, 幅, ふくらむ側]。
const stems = ["M0 250C22 190 60 118 156 34", "M34 186C62 178 96 176 136 162"];

const leaves = [
  [8.7, 227.9, 76.8, 54, 23, 1],
  [17.3, 208.7, -26.5, 50, 22, -1],
  [29.6, 184.6, 79, 47, 20, 1],
  [44.6, 159.6, -15.3, 43, 19, -1],
  [62.6, 133.5, 82.5, 38, 17, 1],
  [82.2, 108.7, -2.1, 33, 15, -1],
  [102.8, 85.3, 82.9, 28, 12, 1],
  [123.9, 63.7, 9.5, 22, 10, -1],
  [156, 34, 48.8, 24, 11, 0],
  [64.6, 179.2, 31.4, 28, 12, -1],
  [86.7, 175, 128.7, 26, 11, 1],
  [110.5, 169.7, 31.6, 22, 10, -1],
  [136, 162, 70.7, 20, 9, 0],
] as const;

const round = (value: number) => Math.round(value * 10) / 10;

/** 付け根 (0, 0) から真上へ伸びる葉。ふくらむ側へ少し偏らせ、左右対称の型押しに見せない。 */
const leafOutline = (length: number, width: number, side: number) => {
  const near = width * (0.62 + 0.1 * side);
  const far = width * (0.52 + 0.1 * side);
  const nearBack = width * (0.62 - 0.1 * side);
  const farBack = width * (0.52 - 0.1 * side);

  return `M0 0C${round(near)} ${round(-length * 0.16)} ${round(far)} ${round(-length * 0.7)} 0 ${-length}C${round(-farBack)} ${round(-length * 0.72)} ${round(-nearBack)} ${round(-length * 0.18)} 0 0Z`;
};

const leafVein = (length: number, width: number, side: number) =>
  `M0 ${round(-length * 0.08)}Q${round(width * side * 0.05)} ${round(-length * 0.5)} 0 ${round(-length * 0.88)}`;

const line = css({ fill: "[none]", stroke: "primary.600", _print: { stroke: "primary.700" } });

const leafFill = css({
  fill: "primary.soft",
  stroke: "primary.600",
  _print: { stroke: "primary.700" },
});

/** 用紙の左下に添える枝葉の線画。飾りなので読み上げない。 */
export function ReceiptSprig({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 190 250"
      className={cx(css({ display: "block", h: "auto", flexShrink: "0" }), className)}
      aria-hidden="true"
      focusable="false"
    >
      {stems.map((d) => (
        <path
          key={d}
          d={d}
          className={line}
          strokeWidth="1.1"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {leaves.map(([x, y, angle, length, width, side]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${angle})`}>
          <path
            d={leafOutline(length, width, side)}
            className={leafFill}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={leafVein(length, width, side)}
            className={line}
            strokeWidth="0.8"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ))}
    </svg>
  );
}
