export const DEFAULT_PER_PAGE = 20;

export type Paginated<T> = {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export function pageRange(
  page: number,
  perPage: number = DEFAULT_PER_PAGE,
): { from: number; to: number } {
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
