import Link from "next/link";

import { FormPageShell, SurfaceCard, buttonRecipe } from "@/components";

export default function NotFound() {
  return (
    <FormPageShell chrome="public" backHref="/" title="ページが見つかりません">
      <SurfaceCard
        description="指定されたページは存在しないか、移動した可能性があります。"
        title="ページが見つかりません"
      >
        <Link className={buttonRecipe({ variant: "ghost" })} href="/">
          ホームへ戻る
        </Link>
      </SurfaceCard>
    </FormPageShell>
  );
}
