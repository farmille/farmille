import { describe, expect, it, vi } from "vitest";

import {
  createContentReportWithSupabase,
  isReportReasonCode,
  isReportTargetType,
  REPORT_REASON_OPTIONS,
  REPORT_TARGET_TYPES,
} from "@/server/mutations/reports";
import { createServerSupabase } from "@/server/supabase";

const reporterUserId = "11111111-1111-4111-8111-111111111111";

describe("isReportTargetType", () => {
  it("review・usage_report・article・profileのみ許可する", () => {
    for (const targetType of REPORT_TARGET_TYPES) {
      expect(isReportTargetType(targetType)).toBe(true);
    }
    expect(isReportTargetType("material")).toBe(false);
    expect(isReportTargetType("answer")).toBe(false);
  });
});

describe("isReportReasonCode", () => {
  it("選択肢に無い値は拒否する", () => {
    for (const option of REPORT_REASON_OPTIONS) {
      expect(isReportReasonCode(option.value)).toBe(true);
    }
    expect(isReportReasonCode("unknown-reason")).toBe(false);
  });
});

describe("createContentReport", () => {
  it("UUID形式でないtargetIdはDBに触れずnot_foundを返す", async () => {
    const createSupabase = vi.fn<typeof createServerSupabase>();
    const result = await createContentReportWithSupabase(
      {
        reporterUserId,
        targetType: "review",
        targetId: "not-a-uuid",
        reasonCode: "spam",
        detail: null,
      },
      createSupabase,
    );

    expect(result).toEqual({ ok: false, error: "not_found" });
    expect(createSupabase).not.toHaveBeenCalled();
  });
});
