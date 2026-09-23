import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { ReportGraph } from "@/components/UsageReportArticle";
import { APPLICATION_METHODS } from "@/lib/material-page-editor";
import {
  REPORT_METHOD_TARGETS,
  createReportPlot,
  createReportGraph,
  createReportMeasurement,
  type UsageReportInput,
  type UsageReportFieldErrors,
} from "@/lib/usage-report";
import { css } from "../../../../../../styled-system/css";
import { FieldLabel, FieldError } from "./FormUI";

const card = css({
  borderWidth: "1px",
  borderColor: "border.default",
  borderRadius: "card",
  p: "3",
  my: "4",
  display: "grid",
  gap: "3",
});
const row = css({ display: "flex", flexWrap: "wrap", gap: "2", alignItems: "center" });
const candidates = [
  { name: "可販果収量", unit: "kg" },
  { name: "1株あたり収量", unit: "kg/株" },
  { name: "10aあたり収量", unit: "kg/10a" },
  { name: "平均果重", unit: "g" },
  { name: "平均糖度", unit: "Brix" },
  { name: "可販果率", unit: "%" },
  { name: "秀品率", unit: "%" },
  { name: "裂果率", unit: "%" },
  { name: "障害果率", unit: "%" },
  { name: "発芽率", unit: "%" },
  { name: "活着率", unit: "%" },
  { name: "草丈", unit: "cm" },
  { name: "茎径", unit: "mm" },
  { name: "葉数", unit: "枚" },
  { name: "葉色値（SPAD）", unit: "SPAD" },
  { name: "根重", unit: "g" },
  { name: "地上部重", unit: "g" },
  { name: "日持ち日数", unit: "日" },
  { name: "切り花長", unit: "cm" },
  { name: "切り花重", unit: "g" },
  { name: "上位階級率", unit: "%" },
];
export function ReportComparisonFields({
  input,
  onChange,
  errors,
}: {
  input: UsageReportInput;
  onChange: (input: UsageReportInput) => void;
  errors: UsageReportFieldErrors;
}) {
  function updatePlot(id: string, values: Partial<UsageReportInput["plots"][number]>) {
    onChange({
      ...input,
      plots: input.plots.map((plot) => (plot.id === id ? { ...plot, ...values } : plot)),
    });
  }
  function updateMeasurement(
    id: string,
    values: Partial<UsageReportInput["measurements"][number]>,
  ) {
    onChange({
      ...input,
      measurements: input.measurements.map((item) =>
        item.id === id ? { ...item, ...values } : item,
      ),
    });
  }
  function changePlots(plots: UsageReportInput["plots"]) {
    const added = plots.filter((plot) => !input.plots.some((item) => item.id === plot.id));
    onChange({
      ...input,
      plots,
      measurements: input.measurements.map((measurement) => ({
        ...measurement,
        graphs: measurement.graphs.map((graph) => ({
          ...graph,
          rows: [
            ...graph.rows.filter(
              (item) => item.plotId === null || plots.some((plot) => plot.id === item.plotId),
            ),
            ...added.map((plot) => ({
              id: crypto.randomUUID(),
              plotId: plot.id,
              label: "",
              value: "",
            })),
          ],
        })),
      })),
    });
  }
  return (
    <>
      <FieldLabel required>区の設定（2区以上）</FieldLabel>
      <FieldError message={errors.plots} />
      {input.plots.map((plot, index) => (
        <section key={plot.id} className={card}>
          <div className={row}>
            <h3>区 {index + 1}</h3>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={input.plots.length <= 2}
              onClick={() => changePlots(input.plots.filter((item) => item.id !== plot.id))}
            >
              区を削除
            </Button>
          </div>
          <FieldLabel required htmlFor={`${plot.id}-name`}>
            区の名前
          </FieldLabel>
          <Input
            id={`${plot.id}-name`}
            value={plot.name}
            placeholder="処理区、無処理区、慣行区"
            onChange={(event) => updatePlot(plot.id, { name: event.target.value })}
          />
          <FieldError message={errors[`plots.${index}.name`]} />
          <FieldLabel required htmlFor={`${plot.id}-scope`}>
            調査した範囲
          </FieldLabel>
          <Input
            id={`${plot.id}-scope`}
            value={plot.scope}
            placeholder="10株、5m、1畝"
            onChange={(event) => updatePlot(plot.id, { scope: event.target.value })}
          />
          <FieldError message={errors[`plots.${index}.scope`]} />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() =>
              onChange({
                ...input,
                plots: input.plots.map((item) => ({ ...item, scope: plot.scope })),
              })
            }
          >
            全ての区に反映
          </Button>
          <FieldLabel required htmlFor={`${plot.id}-description`}>
            この区の説明
          </FieldLabel>
          <Textarea
            id={`${plot.id}-description`}
            value={plot.description}
            placeholder="〇〇を1,000倍に希釈し、200L/10aを葉面散布した区。7日おきに3回散布しました。"
            onChange={(event) => updatePlot(plot.id, { description: event.target.value })}
          />
          <p>
            施用方法・希釈倍率・使用量・回数と、ほかの区と違う条件を記入してください。資材を使っていない区は「資材なし」と書いてください。
          </p>
          <FieldError message={errors[`plots.${index}.description`]} />
          <FieldLabel>使用方法のタグ（検索用）</FieldLabel>
          {plot.steps.map((step, stepIndex) => (
            <div key={step.id} className={card}>
              <div className={row}>
                <h4>手順 {stepIndex + 1}</h4>
                {stepIndex > 0 && (
                  <button
                    type="button"
                    aria-label={`手順${stepIndex + 1}を削除`}
                    onClick={() =>
                      updatePlot(plot.id, {
                        steps: plot.steps.filter((item) => item.id !== step.id),
                      })
                    }
                  >
                    ×
                  </button>
                )}
              </div>
              <div className={row}>
                {APPLICATION_METHODS.map((method) => (
                  <Button
                    key={method.value}
                    type="button"
                    size="sm"
                    variant={step.method === method.value ? "primary" : "ghost"}
                    aria-pressed={step.method === method.value}
                    onClick={() =>
                      updatePlot(plot.id, {
                        steps: plot.steps.map((item) =>
                          item.id === step.id
                            ? {
                                ...item,
                                method: item.method === method.value ? "" : method.value,
                                targets: [],
                                otherText: "",
                              }
                            : item,
                        ),
                      })
                    }
                  >
                    {method.label}
                  </Button>
                ))}
              </div>
              {step.method === "other" ? (
                <label>
                  その他の方法
                  <Input
                    value={step.otherText}
                    placeholder="ハウス内に設置"
                    onChange={(event) =>
                      updatePlot(plot.id, {
                        steps: plot.steps.map((item) =>
                          item.id === step.id ? { ...item, otherText: event.target.value } : item,
                        ),
                      })
                    }
                  />
                </label>
              ) : (
                step.method && (
                  <fieldset>
                    <legend>施用した場所・対象（任意）</legend>
                    <div className={row}>
                      {REPORT_METHOD_TARGETS[step.method].map((target) => (
                        <label key={target}>
                          <input
                            type="checkbox"
                            checked={step.targets.includes(target)}
                            onChange={() =>
                              updatePlot(plot.id, {
                                steps: plot.steps.map((item) =>
                                  item.id === step.id
                                    ? {
                                        ...item,
                                        targets: item.targets.includes(target)
                                          ? item.targets.filter((value) => value !== target)
                                          : [...item.targets, target],
                                      }
                                    : item,
                                ),
                              })
                            }
                          />
                          {target}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              updatePlot(plot.id, {
                steps: [
                  ...plot.steps,
                  { id: crypto.randomUUID(), method: "", targets: [], otherText: "" },
                ],
              })
            }
          >
            ＋ 手順を追加
          </Button>
        </section>
      ))}
      <Button
        type="button"
        variant="ghost"
        onClick={() => changePlots([...input.plots, createReportPlot()])}
      >
        ＋ 区を追加
      </Button>
      <label className={card}>
        <span>
          <input
            type="checkbox"
            checked={input.methodDetailsAck}
            onChange={(event) => onChange({ ...input, methodDetailsAck: event.target.checked })}
          />{" "}
          資材を使った区の説明に、施用方法・希釈倍率・使用量・回数を明記しました（必須）
        </span>
        <FieldError message={errors.methodDetailsAck} />
      </label>
      <datalist id="report-measurement-names">
        {candidates.map(({ name }) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <datalist id="report-measurement-units">
        {[
          "g",
          "kg",
          "kg/10a",
          "t/10a",
          "kg/株",
          "%",
          "Brix",
          "cm",
          "mm",
          "枚",
          "本",
          "個",
          "日",
          "SPAD",
        ].map((unit) => (
          <option key={unit} value={unit} />
        ))}
      </datalist>
      <FieldLabel required>使用結果の調査項目</FieldLabel>
      <FieldError message={errors.measurements} />
      {input.measurements.map((measurement, index) => (
        <section key={measurement.id} className={card}>
          <div className={row}>
            <h3>調査項目 {index + 1}</h3>
            {index > 0 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  onChange({
                    ...input,
                    measurements: input.measurements.filter((item) => item.id !== measurement.id),
                  })
                }
              >
                調査項目を削除
              </Button>
            )}
          </div>
          <FieldLabel required htmlFor={`${measurement.id}-name`}>
            {measurement.kind === "text" ? "見出し" : "指標名"}
          </FieldLabel>
          <Input
            id={`${measurement.id}-name`}
            list="report-measurement-names"
            value={measurement.name}
            placeholder={
              measurement.kind === "text" ? "見出し　例）奇形の発生の様子" : "指標名　例）活着率"
            }
            onChange={(event) => {
              const name = event.target.value;
              updateMeasurement(measurement.id, {
                name,
                unit:
                  candidates.find((candidate) => candidate.name === name)?.unit ?? measurement.unit,
              });
            }}
          />
          <FieldError message={errors[`measurements.${index}.name`]} />
          <div className={row}>
            {(["numeric", "text"] as const).map((kind) => (
              <Button
                key={kind}
                type="button"
                size="sm"
                variant={measurement.kind === kind ? "primary" : "ghost"}
                aria-pressed={measurement.kind === kind}
                onClick={() => updateMeasurement(measurement.id, { kind })}
              >
                {kind === "numeric" ? "数値" : "文章"}
              </Button>
            ))}
          </div>
          {measurement.kind === "text" ? (
            <>
              <FieldLabel required htmlFor={`${measurement.id}-body`}>
                調査した内容と区ごとの違い
              </FieldLabel>
              <Textarea
                id={`${measurement.id}-body`}
                value={measurement.body}
                placeholder="調査した内容と、区ごとの違い"
                onChange={(event) =>
                  updateMeasurement(measurement.id, { body: event.target.value })
                }
              />
              <p>
                記入例：処理区では11月以降も葉色が濃く、成り疲れが見られませんでした。未処理区は12月に入って草勢が落ち、下葉の黄化が目立ちました。
              </p>
              <p>
                切り花長の階級別本数（各区90本）は、処理区が101〜105cm 12本、106〜110cm
                42本、111〜115cm 36本。対照区は101〜105cm 10本、106〜110cm 38本、111〜115cm
                35本、116〜120cm 5本でした。
              </p>
              <p>
                奇形（花芽飛び）の発生節数は設置区が平均1.2節、無設置区が2.5節（平均値±標準誤差、n=30、5%水準で有意差あり）。
              </p>
            </>
          ) : (
            <>
              <label>
                単位（任意）
                <Input
                  list="report-measurement-units"
                  value={measurement.unit}
                  onChange={(event) =>
                    updateMeasurement(measurement.id, { unit: event.target.value })
                  }
                />
              </label>
              {measurement.graphs.map((graph, graphIndex) => {
                function updateGraph(values: Partial<typeof graph>) {
                  updateMeasurement(measurement.id, {
                    graphs: measurement.graphs.map((item) =>
                      item.id === graph.id ? { ...item, ...values } : item,
                    ),
                  });
                }
                return (
                  <div className={card} key={graph.id}>
                    <div className={row}>
                      <h4>グラフ {graphIndex + 1}</h4>
                      {graphIndex > 0 && (
                        <button
                          type="button"
                          aria-label={`グラフ${graphIndex + 1}を削除`}
                          onClick={() =>
                            updateMeasurement(measurement.id, {
                              graphs: measurement.graphs.filter((item) => item.id !== graph.id),
                            })
                          }
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <label>
                      調査時期・グラフの見出し（任意）
                      <Input
                        value={graph.heading}
                        placeholder="定植4週間後の活着率"
                        onChange={(event) => updateGraph({ heading: event.target.value })}
                      />
                    </label>
                    {graph.rows.map((valueRow, rowIndex) => (
                      <div
                        key={valueRow.id}
                        className={css({
                          display: "grid",
                          gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) auto",
                          gap: "2",
                        })}
                      >
                        <Input
                          aria-label={`グラフ${graphIndex + 1}の区分${rowIndex + 1}の名前`}
                          value={valueRow.label}
                          placeholder={
                            input.plots.find((plot) => plot.id === valueRow.plotId)?.name ||
                            "区分の名前"
                          }
                          onChange={(event) =>
                            updateGraph({
                              rows: graph.rows.map((item) =>
                                item.id === valueRow.id
                                  ? { ...item, label: event.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                        <Input
                          aria-label={`グラフ${graphIndex + 1}の区分${rowIndex + 1}の数値`}
                          value={valueRow.value}
                          placeholder="数値"
                          onChange={(event) =>
                            updateGraph({
                              rows: graph.rows.map((item) =>
                                item.id === valueRow.id
                                  ? { ...item, value: event.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                        <button
                          type="button"
                          aria-label={`区分${rowIndex + 1}を削除`}
                          onClick={() =>
                            updateGraph({
                              rows: graph.rows.filter((item) => item.id !== valueRow.id),
                            })
                          }
                        >
                          ×
                        </button>
                        <FieldError
                          message={
                            errors[
                              `measurements.${index}.graphs.${graphIndex}.rows.${rowIndex}.label`
                            ]
                          }
                        />
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        updateGraph({
                          rows: [
                            ...graph.rows,
                            { id: crypto.randomUUID(), plotId: null, label: "", value: "" },
                          ],
                        })
                      }
                    >
                      ＋ 区分・数値を追加
                    </Button>
                    <ReportGraph graph={graph} plots={input.plots} unit={measurement.unit} />
                  </div>
                );
              })}
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  updateMeasurement(measurement.id, {
                    graphs: [...measurement.graphs, createReportGraph(input.plots)],
                  })
                }
              >
                ＋ グラフを追加（時期別など）
              </Button>
              <p>
                ※ 数字の後に誤差や有意差の記号も書けます。例：41.7±0.8 a、82 ＊、40.2
                n.s.。先頭の数値で棒を描き、±の値をエラーバーにします。検定方法・有意水準は結果・感想か文章の調査項目に書いてください。
              </p>
            </>
          )}
          <FieldError message={errors[`measurements.${index}.values`]} />
        </section>
      ))}
      <Button
        type="button"
        variant="ghost"
        onClick={() =>
          onChange({
            ...input,
            measurements: [...input.measurements, createReportMeasurement(input.plots)],
          })
        }
      >
        ＋ 調査項目を追加
      </Button>
      <p>
        記入例：活着率（%）・定植4週間後／切り花長（cm）・収穫時（3月9日）／裂果率（%）・11月分と12月分／奇形の発生の様子（文章）
      </p>
    </>
  );
}
