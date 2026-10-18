import {
  MaterialHeroSkeleton,
  MaterialDetailsSkeleton,
  Skeleton,
  SkeletonRegion,
} from "@/components/Skeleton";
import { css } from "../../../../../styled-system/css";
import { MaterialSectionHeading } from "./MaterialSectionHeading";
import { MaterialPageShell } from "./PageShell";

export function MaterialPageSkeleton() {
  return (
    <MaterialPageShell title="製品情報" backHref="/">
      <SkeletonRegion label="製品情報を読み込んでいます">
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
