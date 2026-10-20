import { AppBar } from "@/components";
import { BottomNav } from "@/components/BottomNav";
import { Skeleton, SkeletonRegion } from "@/components/Skeleton";
import { SearchResultsSkeleton } from "@/components/SkeletonList";
import { css } from "../../../styled-system/css";

export default function SearchLoading() {
  return (
    <div className={css({ minH: "dvh", bg: "surface.page" })}>
      <AppBar chrome="public" active="search" title="BS資材を探す" backHref="/" />
      <main
        className={css({
          maxW: "content.wide",
          mx: "auto",
          px: "4",
          pt: "3",
          pb: "4",
          tab: { px: "5", pt: "6", pb: "8" },
        })}
      >
        <SkeletonRegion label="検索条件を読み込んでいます">
          <div className={css({ display: "grid", gap: "3" })}>
            <Skeleton variant="control" />
            <Skeleton variant="short" />
            <Skeleton variant="control" />
          </div>
        </SkeletonRegion>
        <SearchResultsSkeleton />
      </main>
      <BottomNav active="search" />
    </div>
  );
}
