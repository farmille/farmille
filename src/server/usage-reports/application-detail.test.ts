import { describe, expect, it } from "vitest";

import {
  cultivationTypeDisplayLabel,
  cultivationTypeFromLabel,
} from "@/server/usage-reports/application-detail";

describe("保存済みの栽培形態の表示", () => {
  it("保存済みの栽培形態は日本語名と旧コードのどちらからも復元する", () => {
    expect(cultivationTypeFromLabel("露地栽培")).toBe("open_field");
    expect(cultivationTypeFromLabel("open_field")).toBe("open_field");
    expect(cultivationTypeDisplayLabel("open_field")).toBe("露地栽培");
    expect(cultivationTypeDisplayLabel("露地栽培")).toBe("露地栽培");
  });

  it("未知の栽培形態を空欄や内部値のまま表示しない", () => {
    expect(() => cultivationTypeDisplayLabel("unknown")).toThrow("未対応の栽培形態です：unknown");
  });
});
