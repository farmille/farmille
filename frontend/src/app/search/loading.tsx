import { AppBar, EmptyState } from "@/components";
import { BottomNav } from "@/components/bottom-nav";
import { css } from "../../../styled-system/css";

const shell = css({
  minH: "100dvh",
  display: "flex",
  flexDirection: "column",
  bg: "surface.page",
  color: "text.default",
  fontFamily: "sans",
});

const main = css({
  flex: "1",
  px: "4",
  pt: "3",
  pb: "4",
});

export default function SearchLoading() {
  return (
    <div className={shell}>
      <AppBar title="BS資材を探す" backHref="/" />
      <main className={main}>
        <EmptyState title="検索結果を読み込んでいます" description="しばらくお待ちください。" />
      </main>
      <BottomNav active="search" />
    </div>
  );
}
