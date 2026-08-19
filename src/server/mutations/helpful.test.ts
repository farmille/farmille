import { afterEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  createServerSupabase: vi.fn(),
}));

vi.mock("@/server/supabase", () => supabaseMocks);

import {
  HELPFUL_TARGET_TYPES,
  isHelpfulTargetType,
  toggleHelpfulVote,
} from "@/server/mutations/helpful";

const userId = "11111111-1111-4111-8111-111111111111";

describe("isHelpfulTargetType", () => {
  it("review・usage_report・articleのみ許可する", () => {
    for (const targetType of HELPFUL_TARGET_TYPES) {
      expect(isHelpfulTargetType(targetType)).toBe(true);
    }
    expect(isHelpfulTargetType("answer")).toBe(false);
    expect(isHelpfulTargetType("profile")).toBe(false);
    expect(isHelpfulTargetType("")).toBe(false);
  });
});

describe("toggleHelpfulVote", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("UUID形式でないtargetIdはDBに触れずnot_foundを返す", async () => {
    const result = await toggleHelpfulVote("review", "not-a-uuid", userId);

    expect(result).toEqual({ ok: false, error: "not_found" });
    expect(supabaseMocks.createServerSupabase).not.toHaveBeenCalled();
  });
});
