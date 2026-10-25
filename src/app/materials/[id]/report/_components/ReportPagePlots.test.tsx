import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { UsageReportInput } from "@/lib/usage-report";
import { plotPlan } from "@/lib/usage-report-plots";

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
});
