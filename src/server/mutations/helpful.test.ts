import { describe, expect, it, vi } from "vitest";

import {
  HELPFUL_TARGET_TYPES,
  isHelpfulTargetType,
  toggleHelpfulVoteWithSupabase,
} from "@/server/mutations/helpful";
import { createServerSupabase } from "@/server/supabase";

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
  it("UUID形式でないtargetIdはDBに触れずnot_foundを返す", async () => {
    const createSupabase = vi.fn<typeof createServerSupabase>();

    const result = await toggleHelpfulVoteWithSupabase(
      "review",
      "not-a-uuid",
      userId,
      createSupabase,
    );

    expect(result).toEqual({ ok: false, error: "not_found" });
    expect(createSupabase).not.toHaveBeenCalled();
  });
});
