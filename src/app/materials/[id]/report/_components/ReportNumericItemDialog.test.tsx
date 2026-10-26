import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { reportPlotLayout } from "@/lib/usage-report-plots";

import { ReportNumericItemDialog } from "./ReportNumericItemDialog";
import { itemsFromInput } from "./report-page-state";
import { storyMaterialName, varietyReport } from "./reportStoryFixture";

function renderDialog() {
  const numeric = itemsFromInput(varietyReport).find((item) => item.mode === "numeric");
  if (numeric?.mode !== "numeric") throw new Error("記入例に数値の調査項目がありません。");
  const onClose = vi.fn();
  render(
    <ReportNumericItemDialog
      item={numeric}
      plots={varietyReport.plots}
      layout={reportPlotLayout(varietyReport, storyMaterialName)}
      onCommit={vi.fn()}
      onClose={onClose}
    />,
  );
  return onClose;
}

describe("数値を直すポップアップを閉じるとき", () => {
  it("直していなければ、確かめずに閉じる", () => {
    const onClose = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "直さずに閉じる" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("直した値があれば、捨てる前に確かめる", async () => {
    const onClose = renderDialog();
    fireEvent.change(screen.getByRole("textbox", { name: "単位" }), { target: { value: "kg" } });
    fireEvent.click(screen.getByRole("button", { name: "直さずに閉じる" }));
    expect(onClose).not.toHaveBeenCalled();
    expect(await screen.findByText("記入をやめますか？")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "記入をやめる" }));
    expect(onClose).toHaveBeenCalled();
  });
});

it("数値を直した間だけページの離脱を警告する", () => {
  renderDialog();
  const before = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(before);
  expect(before.defaultPrevented).toBe(false);
  const unit = screen.getByRole("textbox", { name: "単位" });
  fireEvent.change(unit, { target: { value: "kg" } });
  const changed = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(changed);
  expect(changed.defaultPrevented).toBe(true);
  fireEvent.change(unit, { target: { value: "g" } });
  const restored = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(restored);
  expect(restored.defaultPrevented).toBe(false);
});
