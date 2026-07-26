import { describe, expect, it } from "vitest";

import { fail, succeed, toResponse } from "@/server/result";

describe("Result", () => {
  it("成功値を契約どおりに包む", () => {
    expect(succeed({ id: "material-1" })).toEqual({
      ok: true,
      data: { id: "material-1" },
    });
  });

  it("失敗コードを契約どおりに包む", () => {
    expect(fail("not_found")).toEqual({
      ok: false,
      error: "not_found",
    });
  });
});

describe("toResponse", () => {
  it("成功結果を200で返す", async () => {
    const response = toResponse(succeed({ id: "material-1" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: { id: "material-1" },
    });
  });

  it("エラーコードに対応するHTTPステータスを返す", async () => {
    const response = toResponse(fail("not_found"));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "not_found",
    });
  });

  it("明示されたHTTPステータスを優先する", () => {
    expect(toResponse(succeed(null), 201).status).toBe(201);
  });
});
