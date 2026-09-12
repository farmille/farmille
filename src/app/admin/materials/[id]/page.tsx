import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "@/app/admin/_components/AdminShell";
import { Panel, adminInlineNoteStyle } from "@/app/admin/_components/AdminUI";
import { requireAdminPage } from "@/app/admin/_lib/access";
import { ClaimForm } from "@/app/admin/materials/[id]/ClaimForm";
import { MaterialForm } from "@/app/admin/materials/_components/MaterialForm";
import { PublicationStatusForm } from "@/app/admin/materials/[id]/PublicationStatusForm";
import { FormMessage } from "@/components/auth/Fields";
import { getAdminMaterial } from "@/server/admin/materials";
import { listClaimableSellers } from "@/server/admin/sellers";
import { errorMessageJa } from "@/server/errors";
import { listClassificationOptions } from "@/server/queries/classifications";
import { css } from "../../../../../styled-system/css";

export const metadata: Metadata = {
  title: "資材の編集",
};

const linkStyle = css({
  color: "brand.primary",
  textDecoration: "none",
  _hover: { textDecoration: "underline" },
});

export default async function AdminMaterialDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;

  await requireAdminPage(`/admin/materials/${id}`);

  const [material, classifications, sellers, { created }] = await Promise.all([
    getAdminMaterial(id),
    listClassificationOptions(),
    listClaimableSellers(),
    searchParams,
  ]);

  if (!material.ok) {
    if (material.error === "not_found") notFound();
    throw new Error(errorMessageJa[material.error]);
  }
  if (!classifications.ok) throw new Error(errorMessageJa[classifications.error]);
  if (!sellers.ok) throw new Error(errorMessageJa[sellers.error]);

  return (
    <AdminShell
      backHref="/admin/materials"
      backLabel="資材の管理"
      description={`${material.data.manufacturer_name}／レビュー ${material.data.review_count} 件`}
      title={material.data.name}
    >
      {created === "1" ? <FormMessage tone="info">資材を登録しました。</FormMessage> : null}

      <Panel
        note={
          material.data.sellerName === null
            ? "未 claim"
            : `claim 済み：${material.data.sellerName}／メーカー確認：${material.data.manufacturer_verified_at === null ? "未確認" : "確認済み"}`
        }
        title="claim 紐づけ"
      >
        <ClaimForm
          currentSellerId={material.data.seller_id}
          materialId={material.data.id}
          sellers={sellers.data}
        />
      </Panel>

      <Panel title="公開状態">
        <PublicationStatusForm
          materialId={material.data.id}
          status={material.data.publication_status}
        />
      </Panel>

      <Panel note="admin は分類・検索層と一次情報層の両方を編集できる。" title="資材情報">
        <MaterialForm classifications={classifications.data} material={material.data} />
      </Panel>

      <Panel title="関連">
        <p className={adminInlineNoteStyle}>
          <Link className={linkStyle} href={`/materials/${material.data.id}`}>
            公開中の資材詳細を見る
          </Link>
        </p>
      </Panel>
    </AdminShell>
  );
}
