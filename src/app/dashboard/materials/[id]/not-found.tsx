import { PageNotice } from "@/components/PageNotice";
import Link from "next/link";

import { FormPageShell, buttonRecipe } from "@/components";

export default function SellerMaterialNotFound() {
  return (
    <FormPageShell chrome="seller" backHref="/dashboard" title="資材が見つかりません">
      <PageNotice
        title="編集できる資材が見つかりません"
        description="自社がclaimした資材だけを編集できます。"
      >
        <Link className={buttonRecipe({ size: "sm", variant: "ghost" })} href="/dashboard">
          自社資材一覧へ戻る
        </Link>
      </PageNotice>
    </FormPageShell>
  );
}
