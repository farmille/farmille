import { AppBar, ArticlesToolbar } from "@/components";
import { BottomNav } from "@/components/BottomNav";
import { SkeletonList } from "@/components/SkeletonList";
import { css } from "../../../styled-system/css";

export default function ArticlesLoading() {
  return (
    <div className={css({ minH: "100dvh", bg: "surface.page" })}>
      <AppBar chrome="public" active="articles" title="記事を読む" backHref="/" />
      <main
        className={css({
          maxW: "content.wide",
          mx: "auto",
          px: "3.5",
          py: "4",
          tab: { px: "5", py: "6" },
        })}
      >
        <ArticlesToolbar filter="all" q="" />
        <SkeletonList variant="articles" label="記事を読み込んでいます" />
      </main>
      <BottomNav active="articles" />
    </div>
  );
}
