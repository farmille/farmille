import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "@/app/admin/_components/admin-shell";
import { Panel, adminInlineNoteStyle } from "@/app/admin/_components/admin-ui";
import { requireAdminPage } from "@/app/admin/_lib/access";
import { ClaimForm } from "@/app/admin/materials/[id]/claim-form";
import { MaterialForm } from "@/app/admin/materials/_components/material-form";
import { FormMessage } from "@/components/auth/fields";
import { getAdminMaterial } from "@/server/admin/materials";
import { listClaimableSellers } from "@/server/admin/sellers";
import { listAdminTags } from "@/server/admin/tags";
import { errorMessageJa } from "@/server/errors";
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

  const [material, tags, sellers, { created }] = await Promise.all([
    getAdminMaterial(id),
    listAdminTags(),
    listClaimableSellers(),
    searchParams,
  ]);

  if (!material.ok) {
    if (material.error === "not_found") notFound();
    throw new Error(errorMessageJa[material.error]);
  }
  if (!tags.ok) throw new Error(errorMessageJa[tags.error]);
  if (!sellers.ok) throw new Error(errorMessageJa[sellers.error]);

  return (
    <AdminShell
      backHref="/admin/materials"
      backLabel="← 資材の管理"
      description={`${material.data.manufacturer_name}／レビュー ${material.data.review_count} 件`}
      title={material.data.name}
    >
      {created === "1" ? <FormMessage tone="info">資材を登録しました。</FormMessage> : null}

      <Panel
        note={
          material.data.sellerName === null
            ? "未 claim（メーカー確認済みバッジなし）"
            : `claim 済み：${material.data.sellerName}`
        }
        title="claim 紐づけ"
      >
        <ClaimForm
          currentSellerId={material.data.seller_id}
          materialId={material.data.id}
          sellers={sellers.data}
        />
      </Panel>

      <Panel note="admin は分類・検索層と一次情報層の両方を編集できる。" title="資材情報">
        <MaterialForm material={material.data} tags={tags.data} />
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
