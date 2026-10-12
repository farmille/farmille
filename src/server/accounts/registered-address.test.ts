import { describe, expect, it } from "vitest";

import { fail, succeed } from "@/server/result";

import {
  loadRegisteredAddress,
  type RegisteredAddress,
  type RegisteredAddressStore,
} from "./registered-address";

function memoryStore(rows: Record<string, RegisteredAddress>) {
  const reads: string[] = [];
  const store: RegisteredAddressStore = {
    async findByUserId(userId) {
      reads.push(userId);
      return succeed(rows[userId] ?? null);
    },
  };
  return { store, reads };
}

const rows = {
  self: { prefectureCode: 8 },
  other: { prefectureCode: 13 },
};

describe("loadRegisteredAddress", () => {
  it("セッションの本人の都道府県だけを返す", async () => {
    const { store, reads } = memoryStore(rows);

    expect(await loadRegisteredAddress(succeed({ userId: "self" }), store)).toEqual({
      ok: true,
      data: { prefectureCode: 8 },
    });
    expect(reads).toEqual(["self"]);
  });

  it("未ログインでは読みに行かずに失敗を返す", async () => {
    const { store, reads } = memoryStore(rows);

    expect(await loadRegisteredAddress(fail("unauthorized"), store)).toEqual({
      ok: false,
      error: "unauthorized",
    });
    expect(reads).toEqual([]);
  });

  it("プロフィールが無ければ not_found を返す", async () => {
    const { store } = memoryStore(rows);

    expect(await loadRegisteredAddress(succeed({ userId: "missing" }), store)).toEqual({
      ok: false,
      error: "not_found",
    });
  });

  it("読み取りの失敗はそのまま返す", async () => {
    const store: RegisteredAddressStore = { findByUserId: async () => fail("internal") };

    expect(await loadRegisteredAddress(succeed({ userId: "self" }), store)).toEqual({
      ok: false,
      error: "internal",
    });
  });
});
