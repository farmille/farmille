import Link from "next/link";

import { AppBar, BottomNav, EmptyState } from "@/components";
import { css } from "../../../../../styled-system/css";

const shell = css({
  minH: "100dvh",
  display: "flex",
  flexDirection: "column",
  bg: "surface.panel",
});

const body = css({
  flex: "1",
  px: "4",
  py: "8",
});

export default function CompareNotFound() {
  return (
    <div className={shell}>
      <AppBar title="資材比較" backHref="/me/saved" />
      <main className={body}>
        <EmptyState
          title="比較できる資材が見つかりません"
          description="検討リストから2〜4件を選んで比較してください。"
        >
          <Link
            href="/me/saved"
            className={css({
              mt: "2",
              color: "brand.primary",
              fontWeight: "700",
              textDecoration: "none",
            })}
          >
            検討リストへ戻る →
          </Link>
        </EmptyState>
      </main>
      <BottomNav active="me" />
    </div>
  );
}
