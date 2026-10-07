import {
  MaterialHeroSkeleton,
  MaterialDetailsSkeleton,
  Skeleton,
  SkeletonRegion,
} from "@/components/Skeleton";
import { css } from "../../../../../styled-system/css";
import { MaterialSectionHeading } from "./MaterialSectionHeading";
import { MaterialPageShell } from "./PageShell";

/** 資材ページの読み込み中。外枠と見出しは表示後と同じものを使う。 */
export function MaterialPageSkeleton() {
  return (
    <MaterialPageShell title="資材情報" backHref="/">
      <SkeletonRegion label="資材情報を読み込んでいます">
        <div className={css({ display: "grid", gap: "4" })}>
          <MaterialHeroSkeleton />
          <Skeleton variant="short" />
          <MaterialSectionHeading title="資材詳細" />
          <MaterialDetailsSkeleton />
        </div>
      </SkeletonRegion>
    </MaterialPageShell>
  );
}
