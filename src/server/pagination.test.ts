import { PostgrestError, type PostgrestResponse } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { pageRange, selectAllRows } from "@/server/pagination";

describe("pageRange", () => {
  it("指定件数で後続ページの両端を返す", () => {
    expect(pageRange(3, 10)).toEqual({ from: 20, to: 29 });
  });

  it.each([
    [0, 10],
    [1.5, 10],
    [1, 0],
    [1, 2.5],
  ])("正の整数でない指定を拒否する", (page, perPage) => {
    expect(() => pageRange(page, perPage)).toThrow(RangeError);
  });
});

type Row = { id: number };

/** max_rows を超えた分を黙って切り捨てる PostgREST の range 取得を再現する。 */
function truncatingTable(size: number, maxRows: number) {
  const rows: Row[] = Array.from({ length: size }, (_, id) => ({ id }));
  function selectPage(from: number, to: number): Promise<PostgrestResponse<Row>> {
    return Promise.resolve({
      success: true,
      error: null,
      data: rows.slice(from, Math.min(to + 1, from + maxRows)),
      count: null,
      status: 200,
      statusText: "OK",
    });
  }
  return { rows, selectPage };
}

describe("selectAllRows", () => {
  it.each([0, 1_000, 1_001, 2_500])(
    "max_rows が1000のとき、%i 行を欠けも重複もなく順に返す",
    async (size) => {
      const table = truncatingTable(size, 1_000);

      await expect(selectAllRows(table.selectPage)).resolves.toEqual({
        data: table.rows,
        error: null,
      });
    },
  );

  it("max_rows が1回の要求件数より小さいサーバーでも全件返す", async () => {
    const table = truncatingTable(1_001, 300);

    await expect(selectAllRows(table.selectPage)).resolves.toEqual({
      data: table.rows,
      error: null,
    });
  });

  it("途中のページが失敗したら、取得済みの行を返さずにエラーを返す", async () => {
    const table = truncatingTable(1_500, 1_000);
    const error = new PostgrestError({
      message: "canceling statement due to statement timeout",
      details: "",
      hint: "",
      code: "57014",
    });

    const result = await selectAllRows<Row>((from, to) =>
      from === 0
        ? table.selectPage(from, to)
        : Promise.resolve({
            success: false,
            error,
            data: null,
            count: null,
            status: 500,
            statusText: "Internal Server Error",
          }),
    );

    expect(result).toEqual({ data: null, error });
  });
});
