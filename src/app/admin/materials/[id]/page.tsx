import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "@/app/admin/_components/AdminShell";
import { Panel, adminBodyStyle, adminInlineNoteStyle } from "@/app/admin/_components/AdminUI";
import { requireAdminPage } from "@/app/admin/_lib/access";
import { ClaimForm } from "@/app/admin/materials/[id]/ClaimForm";
import { MaterialForm } from "@/app/admin/materials/_components/MaterialForm";
import { PublicationStatusForm } from "@/app/admin/materials/[id]/PublicationStatusForm";
import { Notice } from "@/components/form";
import { getAdminMaterial } from "@/server/admin/materials";
import { listClaimableSellers } from "@/server/admin/sellers";
import { errorMessageJa } from "@/server/errors";
import { listClassificationOptions } from "@/server/queries/classifications";
import { css } from "../../../../../styled-system/css";
import { listMaterialPageAudits, listMaterialEditorGrants } from "@/server/material-page-audits";
import { formatDateJa } from "@/components";
import { MaterialAuditForm } from "./MaterialAuditForm";

export const metadata: Metadata = {
  title: "資材の編集",
};

const linkStyle = css({
  color: "text.brand",
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
  const [grants, audits] = await Promise.all([
    listMaterialEditorGrants(id),
    listMaterialPageAudits(id),
  ]);

  return (
    <AdminShell
      backHref="/admin/materials"
      backLabel="資材の管理"
      description={`${material.data.manufacturer_name}／感想口コミ ${material.data.review_count} 件`}
      title={material.data.name}
    >
      {created === "1" ? <Notice tone="success">資材を登録しました。</Notice> : null}

      <Panel
        note={
          material.data.sellerName === null
            ? "資材オーナー権限は未付与です。既存の紐づけがあった場合も書類確認が必要です。"
            : `資材オーナー権限を付与したメーカー：${material.data.sellerName}`
        }
        title="資材オーナー権限と所有権の書類確認"
      >
        <ClaimForm
          currentSellerId={material.data.seller_id}
          materialId={material.data.id}
          sellers={sellers.data}
        />
        {grants.map((grant) => (
          <p className={adminBodyStyle} key={grant.id}>
            {formatDateJa(grant.granted_at)}／{grant.revoked_at ? "取消済み" : "有効"}／書類：
            {grant.document_reference}
          </p>
        ))}
      </Panel>

      <Panel title="掲載後の確認・監査">
        <MaterialAuditForm materialId={id} />
        {audits.map((audit) => (
          <p className={adminBodyStyle} key={audit.id}>
            {formatDateJa(audit.created_at)}／{audit.note}
          </p>
        ))}
      </Panel>

      <Panel title="公開状態">
        <PublicationStatusForm
          materialId={material.data.id}
          status={material.data.publication_status}
        />
      </Panel>

      <Panel title="製品情報">
        {material.data.seller_id !== null || material.data.published_page_version_id !== null ? (
          <p className={adminInlineNoteStyle}>
            この資材の原稿はメーカーが管理します。内容の修正はメーカーへ依頼し、提出された原稿を
            <Link className={linkStyle} href="/admin/materials/expressions">
              表現確認
            </Link>
            で確認してください。
          </p>
        ) : (
          <MaterialForm classifications={classifications.data} material={material.data} />
        )}
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
