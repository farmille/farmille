import { SectionHeading } from "@/components";
import {
  MaterialHeroSkeleton,
  MaterialDetailsSkeleton,
  Skeleton,
  SkeletonRegion,
} from "@/components/Skeleton";
import { css } from "../../../../../styled-system/css";
import { MaterialPageShell } from "./PageShell";

export function MaterialPageSkeleton() {
  return (
    <MaterialPageShell title="資材情報" backHref="/">
      <SkeletonRegion label="資材情報を読み込んでいます">
        <div className={css({ display: "grid", gap: "4" })}>
          <MaterialHeroSkeleton />
          <Skeleton variant="short" />
          <p
            className={css({
              m: "0",
              p: "3",
              borderRadius: "button",
              bg: "surface.page",
              color: "text.subtle",
              fontSize: "xs",
              lineHeight: "1.65",
            })}
          >
            掲載情報は、製造元公式サイト等の公開情報をもとに Farmille
            が独自に整理・分類したものです。最新・正式な使用方法は必ず製造元公式情報をご確認ください。
          </p>
          <SectionHeading title="資材詳細" />
          <MaterialDetailsSkeleton />
        </div>
      </SkeletonRegion>
    </MaterialPageShell>
  );
}
