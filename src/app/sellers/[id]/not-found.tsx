import Link from "next/link";

import { AppBar, buttonRecipe, EmptyState } from "@/components";
import { css, cx } from "../../../../styled-system/css";

export default function SellerNotFound() {
  return (
    <div
      className={css({
        minH: "100dvh",
        bg: "surface.panel",
        color: "text.default",
        fontFamily: "sans",
      })}
    >
      <AppBar chrome="public" active="search" title="メーカーが見つかりません" backHref="/" />
      <main className={css({ px: "4", py: "4" })}>
        <EmptyState
          title="メーカーが見つかりません"
          description="指定されたメーカーは存在しないか、現在公開されていません。"
          className={css({ minH: "60dvh" })}
        >
          <Link
            href="/"
            className={cx(buttonRecipe({ variant: "primary", size: "sm" }), css({ mt: "3" }))}
          >
            ホームへ戻る
          </Link>
        </EmptyState>
      </main>
    </div>
  );
}
