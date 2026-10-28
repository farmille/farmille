import * as v from "valibot";
import { describe, expect, it } from "vitest";

import { fail, resultSchema, toResponse } from "@/server/result";

describe("toResponse", () => {
  it("エラーコードに対応するHTTPステータスを返す", async () => {
    const response = toResponse(fail("not_found"), v.null());

    expect(response.status).toBe(404);
    const parsed = v.parse(resultSchema(v.null()), await response.json());
    expect(parsed).toEqual({
      ok: false,
      error: "not_found",
    });
  });
});
