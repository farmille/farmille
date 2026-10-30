import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { REPORT_PLOT_LIMIT, type UsageReportInput } from "@/lib/usage-report";
import { plotPlan, reportPlotEdits } from "@/lib/usage-report-plots";

import { ReportPagePlots } from "./ReportPagePlots";
import { storyMaterialName, varietyReport } from "./reportStoryFixture";

describe("組み合わせの表を出している間の区の追加", () => {
  it("表を出していても区を1つ足せ、既定は先頭の品種と投稿した資材", () => {
    expect(plotPlan(varietyReport, storyMaterialName).showMatrix).toBe(true);
    const onChange = vi.fn<(next: UsageReportInput) => void>();
    render(
      <ReportPagePlots
        input={varietyReport}
        postedName={storyMaterialName}
        onChange={onChange}
        missing={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "区を追加" }));
    const [next] = onChange.mock.lastCall ?? [];
    const added = next?.plots.find((plot) => !varietyReport.plots.some(({ id }) => id === plot.id));
    expect(next?.plots).toHaveLength(varietyReport.plots.length + 1);
    expect(added).toMatchObject({
      varietyId: varietyReport.varieties[0]?.id,
      treatment: { kind: "posted" },
    });
  });

  it("区が上限を超える追加は断って案内し、書いた名前を残す", () => {
    let input = varietyReport;

    for (
      let i = 0;
      input.plots.length + varietyReport.varieties.length <= REPORT_PLOT_LIMIT;
      i += 1
    )
      input = reportPlotEdits.addComparedMaterial(input, `資材${i}`, storyMaterialName);
    const onChange = vi.fn<(next: UsageReportInput) => void>();
    render(
      <ReportPagePlots
        input={input}
        postedName={storyMaterialName}
        onChange={onChange}
        missing={false}
      />,
    );
    const name = screen.getByRole("textbox", { name: "足す比較した資材の名前" });
    fireEvent.change(name, { target: { value: "ノビテク" } });
    fireEvent.click(screen.getByRole("button", { name: "比較した資材を足す" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      `比較した資材を足すと区が${REPORT_PLOT_LIMIT}を超えるため、足せません。`,
    );
    expect(name).toHaveValue("ノビテク");
  });
});
