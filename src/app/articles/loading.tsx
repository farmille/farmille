import { MockPageShell } from "@/app/_mock/MockPageShell";
// mock.css（MockPageShell が読み込む）より後に読み込む。
import "@/app/_mock/reports-articles.css";
import { SkeletonList } from "@/components/SkeletonList";

import { ArticlesSearchBar } from "./_components/ArticlesSearchBar";

export default function ArticlesLoading() {
  return (
    <MockPageShell>
      <ArticlesSearchBar filter="all" q="" />
      <SkeletonList variant="articles" label="記事を読み込んでいます" />
    </MockPageShell>
  );
}
