"use client";

import { usePathname } from "next/navigation";

import { FormPageShell } from "@/components/FormPageShell";
import { Skeleton, SkeletonRegion } from "@/components/Skeleton";
import { css } from "../../../../../styled-system/css";

export default function ReviewFormLoading() {
  // 読み込み中の境界は params を受け取れないので、開いている URL から戻り先の資材ページを決める
  const pathname = usePathname();
  const materialPath = /^\/materials\/[^/]+/.exec(pathname)?.[0];

  if (materialPath === undefined) {
    throw new Error(`感想口コミの画面ではない URL です：${pathname}`);
  }

  return (
    <FormPageShell chrome="public" active="search" title="感想口コミ" backHref={materialPath}>
      <SkeletonRegion label="感想口コミの入力欄を読み込んでいます">
        <div className={css({ display: "grid", gap: "3" })}>
          <Skeleton variant="control" />
          <Skeleton variant="short" />
          <Skeleton variant="control" />
          <Skeleton variant="short" />
          <Skeleton variant="control" />
          <Skeleton variant="short" />
          <Skeleton variant="product" />
        </div>
      </SkeletonRegion>
    </FormPageShell>
  );
}
