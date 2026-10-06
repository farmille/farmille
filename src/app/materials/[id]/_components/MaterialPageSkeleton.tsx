import {
  MaterialHeroSkeleton,
  MaterialDetailsSkeleton,
  Skeleton,
  SkeletonRegion,
} from "@/components/Skeleton";
import { css } from "../../../../../styled-system/css";
import { MaterialPageShell } from "./PageShell";

/** 資材ページの読み込み中。外枠は表示後と同じ見本の外枠、見出しは見本の `.sec-h`。 */
export function MaterialPageSkeleton() {
  return (
    <MaterialPageShell title="資材情報" backHref="/">
      <SkeletonRegion label="資材情報を読み込んでいます">
        <div className={css({ display: "grid", gap: "4" })}>
          <MaterialHeroSkeleton />
          <Skeleton variant="short" />
          <div className="sec-h">
            <h2>資材詳細</h2>
          </div>
          <MaterialDetailsSkeleton />
        </div>
      </SkeletonRegion>
    </MaterialPageShell>
  );
}
