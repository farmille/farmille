import { Icon } from "@/components/Icon";
import Link from "next/link";

import { AppBar, EmptyState } from "@/components";
import { BottomNav } from "@/components/BottomNav";
import { css } from "../../../../../styled-system/css";

const shell = css({
  minH: "100dvh",
  display: "flex",
  flexDirection: "column",
  bg: "surface.page",
});

const body = css({
  flex: "1",
  w: "100%",
  maxW: "content.form",
  mx: "auto",
  px: "4",
  py: "8",
  bg: "surface.panel",
});

export default function CompareNotFound() {
  return (
    <div className={shell}>
      <AppBar chrome="public" active="me" title="資材比較" backHref="/me/saved" />
      <main className={body}>
        <EmptyState
          title="比較できる資材が見つかりません"
          description="お気に入りから2〜4件を選んで比較してください。"
        >
          <Link
            href="/me/saved"
            className={css({
              mt: "2",
              color: "primary.700",
              fontWeight: "bold",
              textDecoration: "none",
            })}
          >
            お気に入りへ戻る <Icon name="arrow_forward" size="sm" />
          </Link>
        </EmptyState>
      </main>
      <BottomNav active="me" />
    </div>
  );
}
