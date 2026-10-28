import { css, cx } from "../../styled-system/css";

const boxStyle = css({
  display: "grid",
  gridTemplateColumns: "[auto minmax(0, 1fr)]",
  columnGap: "3",
  rowGap: "1",
  m: "0",
  px: "3",
  py: "2.5",
  bg: "surface.page",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "input",
  textStyle: "supporting",
});
const rowStyle = css({ display: "contents" });
const termStyle = css({ color: "text.subtle", whiteSpace: "nowrap" });
// 語の途中ではなく「、」の位置で折り返す
const valueStyle = css({
  m: "0",
  minW: "0",
  color: "text.default",
  wordBreak: "keep-all",
  overflowWrap: "anywhere",
});

type ReportFactsProps = {
  /** 作物名。品種があれば括弧で添えた表記 */
  crop: string | null;
  effects: readonly string[];
  standpoint: string | undefined;
  className?: string;
};

type Fact = { label: string; value: string };

/** 実証詳細レポートの見出しの下に、作物・効果・立場を項目名つきで並べる。 */
export function ReportFacts({ crop, effects, standpoint, className }: ReportFactsProps) {
  const facts: Fact[] = [];
  if (crop) facts.push({ label: "作物", value: crop });
  if (effects.length > 0) facts.push({ label: "効果", value: effects.join("、") });
  if (standpoint) facts.push({ label: "立場", value: standpoint });
  if (facts.length === 0) return null;
  return (
    <dl className={cx(boxStyle, className)}>
      {facts.map((fact) => (
        <div key={fact.label} className={rowStyle}>
          <dt className={termStyle}>{fact.label}</dt>
          <dd className={valueStyle}>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
