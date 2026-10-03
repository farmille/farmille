import type { PostgrestError, PostgrestResponse } from "@supabase/supabase-js";

export const DEFAULT_PER_PAGE = 20;

export type Paginated<T> = {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export type PageRange = { from: number; to: number };

export function pageRange(page: number, perPage: number = DEFAULT_PER_PAGE): PageRange {
  if (!Number.isInteger(page) || page < 1) {
    throw new RangeError("page は1以上の整数で指定してください。");
  }

  if (!Number.isInteger(perPage) || perPage < 1) {
    throw new RangeError("perPage は1以上の整数で指定してください。");
  }

  const from = (page - 1) * perPage;

  return {
    from,
    to: from + perPage - 1,
  };
}

const SELECT_ALL_PAGE_SIZE = 1_000;

/**
 * PostgREST は max_rows を超えた行を黙って切り捨て、その上限はサーバーの設定で変わる。
 * 短いページでは止めず、空のページが返るまで続きを取る。
 * selectPage は一意な列（id など）で並べ、ページの間で行の順序が変わらないようにする。
 */
export async function selectAllRows<Row>(
  selectPage: (from: number, to: number) => PromiseLike<PostgrestResponse<Row>>,
): Promise<{ data: Row[]; error: null } | { data: null; error: PostgrestError }> {
  const rows: Row[] = [];
  for (;;) {
    const page = await selectPage(rows.length, rows.length + SELECT_ALL_PAGE_SIZE - 1);
    if (page.error !== null) return { data: null, error: page.error };
    if (page.data.length === 0) return { data: rows, error: null };
    rows.push(...page.data);
  }
}
