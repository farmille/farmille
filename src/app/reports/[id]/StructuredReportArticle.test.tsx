import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createBlankUsageReport } from "@/lib/usage-report";

import { StructuredReportArticle } from "./StructuredReportArticle";

function sampleReport() {
  const input = createBlankUsageReport(crypto.randomUUID());
  const [control, treated] = input.plots;
  if (control === undefined || treated === undefined) throw new Error("区が2つ必要です");
  control.name = "対照区";
  control.scope = "10株";
  control.description = "資材なし";
  treated.name = "使用区";
  treated.scope = "10株";
  treated.description = "1,000倍で散布";
  treated.steps = [{ id: crypto.randomUUID(), method: "spray", targets: ["葉"], otherText: "" }];
  input.observedChange = "午後の萎れが軽くなった";
  input.purposeTags = ["耐暑性改善", "しおれ軽減"];
  const measurement = input.measurements[0];
  const graph = measurement?.graphs[0];
  if (measurement === undefined || graph === undefined) throw new Error("グラフが必要です");
  measurement.name = "可販果率";
  measurement.unit = "%";
  graph.rows[0] = { ...graph.rows[0]!, value: "74" };
  graph.rows[1] = { ...graph.rows[1]!, value: "82±3 a" };
  return input;
}

describe("実証詳細レポート（新形式）の記事", () => {
  it("見本の節の順に見出しを並べ、比較した区とグラフを出す", () => {
    render(
      <StructuredReportArticle
        input={sampleReport()}
        cropLabel="ミニトマト（アイコ）"
        documentUrls={[]}
      />,
    );
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
      "結果・感想",
      "期待した効果",
      "栽培条件・施用時期",
      "比較した区",
      "使用結果の詳細：可販果率",
    ]);
    expect(screen.getByText("耐暑性改善、しおれ軽減")).toBeInTheDocument();
    expect(screen.getByText(/使用作物：ミニトマト（アイコ）/)).toBeInTheDocument();
    expect(screen.getByText("1,000倍で散布")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "対照区 74 %" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "使用区 82±3 a %" })).toBeInTheDocument();
    expect(
      screen.getByText("グラフは投稿されたデータからFarmilleが自動生成しています"),
    ).toBeInTheDocument();
    // 施用方法タグは記事に出さない
    expect(screen.queryByText("施用方法")).toBeNull();
  });
});
