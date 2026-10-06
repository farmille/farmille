import { MockPageShell } from "@/app/_mock/MockPageShell";
import { Skeleton, SkeletonRegion } from "@/components/Skeleton";
import { SearchResultsSkeleton } from "@/components/SkeletonList";
import { css } from "../../../styled-system/css";

export default function SearchLoading() {
  return (
    <MockPageShell active="search" title="BS資材を探す" backHref="/" footer={false}>
      <SkeletonRegion label="検索条件を読み込んでいます">
        <div className={css({ display: "grid", gap: "3" })}>
          <Skeleton variant="control" />
          <Skeleton variant="short" />
          <Skeleton variant="control" />
        </div>
      </SkeletonRegion>
      <SearchResultsSkeleton />
    </MockPageShell>
  );
}
