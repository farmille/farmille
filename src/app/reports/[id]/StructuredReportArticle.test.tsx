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
        materialName="ハイパーバイオ"
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
    expect(screen.getByText(/使用対象作目：ミニトマト（アイコ）/)).toBeInTheDocument();
    expect(screen.getByText("1,000倍で散布")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "対照区 74 %" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "使用区 82±3 a %" })).toBeInTheDocument();
    expect(
      screen.getByText("グラフは投稿されたデータからFarmilleが自動生成しています"),
    ).toBeInTheDocument();
    expect(screen.queryByText("施用方法")).toBeNull();
  });
  it("画像の調査項目は、項目名・画像・補足説明を調査項目の並びで出し、節の最後に画像を重ねて出さない", () => {
    const input = sampleReport();
    const image = {
      id: crypto.randomUUID(),
      kind: "image" as const,
      name: "果実の断面",
      unit: "",
      body: "使用区は果肉が厚かった。",
      graphs: [],
    };
    const text = {
      ...image,
      id: crypto.randomUUID(),
      kind: "text" as const,
      name: "食味",
      body: "皮が薄く感じた。",
    };
    input.measurements = [image, ...input.measurements, text];
    input.media = [
      {
        id: crypto.randomUUID(),
        url: "https://example.test/storage/v1/object/public/report-media/u/r/a.jpg",
        mediaType: "photo",
        section: "measurements",
        caption: "図1 果実の断面",
        measurementId: image.id,
      },
    ];
    render(
      <StructuredReportArticle
        materialName="ハイパーバイオ"
        input={input}
        cropLabel="ミニトマト"
        documentUrls={[]}
      />,
    );
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((h) => h.textContent)
        .filter((text) => text?.startsWith("使用結果の詳細")),
    ).toEqual(["使用結果の詳細：果実の断面", "使用結果の詳細：可販果率", "使用結果の詳細：食味"]);
    expect(screen.getAllByRole("img", { name: "図1 果実の断面" })).toHaveLength(1);
    expect(screen.getByText("図1 果実の断面", { selector: "figcaption" })).toBeInTheDocument();
    expect(screen.getByText("使用区は果肉が厚かった。")).toBeInTheDocument();
  });
  it("同じ名前と単位の数値の項目は1つの見出しにまとめ、項目ごとの補足説明を残す", () => {
    const input = sampleReport();
    const [first] = input.measurements;
    if (first === undefined) throw new Error("調査項目が必要です");
    first.body = "1回目の調査。";
    const second = {
      ...first,
      id: crypto.randomUUID(),
      body: "2回目の調査。",
      graphs: first.graphs.map((graph) => ({ ...graph, id: crypto.randomUUID() })),
    };
    input.measurements = [first, second];
    render(
      <StructuredReportArticle
        materialName="ハイパーバイオ"
        input={input}
        cropLabel="ミニトマト"
        documentUrls={[]}
      />,
    );
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .filter((h) => h.textContent?.includes("可販果率")),
    ).toHaveLength(1);
    expect(screen.getByText("1回目の調査。")).toBeInTheDocument();
    expect(screen.getByText("2回目の調査。")).toBeInTheDocument();
  });
  it("使用目的の補足を効果タグの次の行に出し、市区町村は公開を選んだ場合だけ都道府県の直後に出す", () => {
    const input = sampleReport();
    input.purposeNote = "高温期の萎れを軽くしたかった";
    input.prefectureCode = 8;
    input.city = "水戸市";
    const { rerender } = render(
      <StructuredReportArticle
        input={input}
        materialName="ハイパーバイオ"
        cropLabel="ミニトマト"
        documentUrls={[]}
      />,
    );
    expect(
      screen.getByText((_, element) =>
        element?.tagName === "P"
          ? element.textContent === "耐暑性改善、しおれ軽減\n高温期の萎れを軽くしたかった"
          : false,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/地域：茨城県(?!水戸市)/)).toBeInTheDocument();
    expect(screen.queryByText(/水戸市/)).toBeNull();
    rerender(
      <StructuredReportArticle
        materialName="ハイパーバイオ"
        input={{ ...input, showCity: true }}
        cropLabel="ミニトマト"
        documentUrls={[]}
      />,
    );
    expect(screen.getByText(/地域：茨城県水戸市/)).toBeInTheDocument();
  });
});
