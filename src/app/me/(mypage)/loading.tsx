import { AppBar } from "@/components";
import { BottomNav } from "@/components/BottomNav";
import { ReviewCardSkeleton, Skeleton, SkeletonRegion } from "@/components/Skeleton";
import { css } from "../../../../styled-system/css";

// プロフィール編集やお気に入りの画面にマイページの骨格を出さないよう、マイページだけの route group に置く
export default function MyPageLoading() {
  return (
    <div
      className={css({ minH: "dvh", display: "flex", flexDirection: "column", bg: "surface.page" })}
    >
      <AppBar chrome="public" active="me" title="マイページ" />
      <main
        className={css({
          flex: "1",
          w: "full",
          maxW: "content.medium",
          mx: "auto",
          px: "4",
          py: "4",
          pb: "6",
          bg: "surface.panel",
          tab: { px: "5", py: "5" },
        })}
      >
        <SkeletonRegion label="マイページを読み込んでいます">
          <div className={css({ display: "grid", gap: "4" })}>
            <Skeleton variant="hero" />
            <div className={css({ display: "flex", alignItems: "center", gap: "3" })}>
              <Skeleton variant="avatar" />
              <Skeleton variant="short" />
            </div>
            <Skeleton variant="short" />
            <Skeleton variant="control" />
            <ReviewCardSkeleton />
          </div>
        </SkeletonRegion>
      </main>
      <BottomNav active="me" />
    </div>
  );
}
