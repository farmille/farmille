import Link from "next/link";

import { EmptyState, FormPageShell, SurfaceCard, buttonRecipe } from "@/components";

export default function SellerMaterialNotFound() {
  return (
    <FormPageShell backHref="/dashboard" title="資材が見つかりません">
      <SurfaceCard>
        <EmptyState
          title="編集できる資材が見つかりません"
          description="自社がclaimした資材だけを編集できます。"
        >
          <Link className={buttonRecipe({ size: "sm", variant: "ghost" })} href="/dashboard">
            自社資材一覧へ戻る
          </Link>
        </EmptyState>
      </SurfaceCard>
    </FormPageShell>
  );
}
