import { expect, it } from "vitest";

import { succeed } from "@/server/result";

import { loadRegisteredAddress, type RegisteredAddressStore } from "./registered-address";

it("セッションの本人の都道府県だけを返す", async () => {
  const rows = new Map([
    ["self", { prefectureCode: 8 }],
    ["other", { prefectureCode: 13 }],
  ]);

  const reads: string[] = [];

  const store: RegisteredAddressStore = {
    async findByUserId(userId) {
      reads.push(userId);

      return succeed(rows.get(userId) ?? null);
    },
  };

  expect(await loadRegisteredAddress(succeed({ userId: "self" }), store)).toEqual({
    ok: true,
    data: { prefectureCode: 8 },
  });
  expect(reads).toEqual(["self"]);
});
