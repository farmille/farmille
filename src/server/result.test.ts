import * as v from "valibot";
import { describe, expect, it } from "vitest";

import { fail, resultSchema, succeed, toResponse } from "@/server/result";

const MaterialReferenceSchema = v.strictObject({ id: v.string() });

describe("toResponse", () => {
  it("成功結果を200で返す", async () => {
    const response = toResponse(succeed({ id: "material-1" }), MaterialReferenceSchema);

    expect(response.status).toBe(200);
    const parsed = v.parse(resultSchema(MaterialReferenceSchema), await response.json());
    expect(parsed).toEqual({
      ok: true,
      data: { id: "material-1" },
    });
  });

  it("エラーコードに対応するHTTPステータスを返す", async () => {
    const response = toResponse(fail("not_found"), v.null());

    expect(response.status).toBe(404);
    const parsed = v.parse(resultSchema(v.null()), await response.json());
    expect(parsed).toEqual({
      ok: false,
      error: "not_found",
    });
  });

  it("成功データに未定義のプロパティがあればレスポンスを生成しない", () => {
    expect(() =>
      toResponse(succeed({ id: "material-1", unexpected: true }), MaterialReferenceSchema),
    ).toThrow("HTTPレスポンスが Result 契約に一致しません");
  });
});
