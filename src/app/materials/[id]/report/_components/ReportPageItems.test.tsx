import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { REPORT_MEASUREMENT_LIMIT } from "@/lib/usage-report";
import { reportPlotLayout } from "@/lib/usage-report-plots";

import { ReportPageItems } from "./ReportPageItems";
import { createReportPageItem } from "./report-page-state";
import { filledReport, storyMaterialName } from "./reportStoryFixture";

function renderItems(count: number) {
  render(
    <ReportPageItems
      items={Array.from({ length: count }, () => ({ ...createReportPageItem(), name: "糖度" }))}
      plots={filledReport.plots}
      layout={reportPlotLayout(filledReport, storyMaterialName)}
      onChange={vi.fn()}
      onOpenFile={vi.fn()}
      onEditNumeric={vi.fn()}
      missing={false}
    />,
  );
}

describe("調査項目の追加", () => {
  it("上限の件数に達したら追加の操作を出さず、上限を案内する", () => {
    renderItems(REPORT_MEASUREMENT_LIMIT);
    expect(screen.queryByRole("button", { name: "調査項目を追加" })).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(
      `調査項目は${REPORT_MEASUREMENT_LIMIT}件まで入れられます。`,
    );
  });

  it("上限より少なければ追加できる", () => {
    renderItems(REPORT_MEASUREMENT_LIMIT - 1);
    expect(screen.getByRole("button", { name: "調査項目を追加" })).toBeInTheDocument();
  });
});
