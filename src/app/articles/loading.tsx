import { SitePageShell } from "@/app/_site/SitePageShell";
import { SkeletonList } from "@/components/SkeletonList";

import { ArticlesSearchBar } from "./_components/ArticlesSearchBar";

export default function ArticlesLoading() {
  return (
    <SitePageShell>
      <ArticlesSearchBar filter="all" q="" />
      <SkeletonList variant="articles" label="記事を読み込んでいます" />
    </SitePageShell>
  );
}
