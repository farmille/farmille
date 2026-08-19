import { describe, expect, it } from "vitest";

import { createBlankCropReport } from "@/server/usage-reports/model";

import {
  activateCropTab,
  addCropTab,
  createCropTabState,
  updateCropTabReport,
} from "./report-form-state";

describe("作物タブの状態", () => {
  it("2作物の入力値を独立して保持する", () => {
    const tomato = createBlankCropReport("tomato");
    tomato.observedChange = "トマトの観察結果";
    let state = createCropTabState([tomato]);

    state = addCropTab(state, "rice");
    const rice = state.cropReports.rice;
    state = updateCropTabReport(state, {
      ...rice,
      observedChange: "水稲の観察結果",
    });

    state = activateCropTab(state, "tomato");
    expect(state.cropReports.tomato.observedChange).toBe("トマトの観察結果");
    expect(state.cropReports.rice.observedChange).toBe("水稲の観察結果");

    state = activateCropTab(state, "rice");
    expect(state.activeCropId).toBe("rice");
    expect(state.cropReports.tomato.observedChange).toBe("トマトの観察結果");
  });
});
