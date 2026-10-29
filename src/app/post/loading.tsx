import { FormPageShell } from "@/components/FormPageShell";
import { Skeleton, SkeletonRegion } from "@/components/Skeleton";
import { SkeletonList } from "@/components/SkeletonList";
import { css } from "../../../styled-system/css";

export default function PostLoading() {
  return (
    <FormPageShell chrome="public" active="post" title="投稿する" backHref="/">
      <SkeletonRegion label="資材の検索欄を読み込んでいます">
        <div className={css({ display: "grid", gap: "3", mb: "3" })}>
          <Skeleton variant="short" />
          <Skeleton variant="control" />
        </div>
      </SkeletonRegion>
      <SkeletonList variant="materials" label="投稿できる資材を読み込んでいます" />
    </FormPageShell>
  );
}
