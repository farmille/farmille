import { FormPageShell } from "@/components/FormPageShell";
import { Skeleton, SkeletonRegion } from "@/components/Skeleton";
import { css } from "../../../../../styled-system/css";

export default function ReviewFormLoading() {
  return (
    <FormPageShell chrome="public" active="search" title="感想口コミ" backHref="/">
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
