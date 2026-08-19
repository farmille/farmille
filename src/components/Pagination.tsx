import Link from "next/link";

import { css, cx } from "../../styled-system/css";
import { buttonRecipe } from "./Button";

type PaginationProps = {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
};

/** 一覧の前後ページリンク。1ページ以下なら非表示。 */
export function Pagination({ page, totalPages, hrefForPage }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="ページネーション"
      className={css({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "3",
        mt: "5",
      })}
    >
      {page > 1 ? (
        <Link
          href={hrefForPage(page - 1)}
          className={buttonRecipe({ variant: "ghost", size: "sm" })}
        >
          前のページ
        </Link>
      ) : (
        <span />
      )}
      <span
        className={css({
          fontSize: "sm",
          color: "text.muted",
          fontVariantNumeric: "tabular-nums",
        })}
      >
        {page} ／ {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={hrefForPage(page + 1)}
          className={cx(buttonRecipe({ variant: "ghost", size: "sm" }))}
        >
          次のページ
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
