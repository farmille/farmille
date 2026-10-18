import type { Metadata } from "next";
import Link from "next/link";

import { AdminShell } from "@/app/admin/_components/AdminShell";
import { Panel } from "@/app/admin/_components/AdminUI";
import { QueryFilter } from "@/app/admin/_components/QueryFilter";
import { requireAdminPage } from "@/app/admin/_lib/access";
import { DataTable, formatDateJa, type DataTableColumn } from "@/components";
import {
  isMaterialChangeRequestStatus,
  isMaterialChangeType,
  MATERIAL_CHANGE_REQUEST_STATUS_LABELS,
  MATERIAL_CHANGE_TYPE_LABELS,
} from "@/lib/material-change";
import {
  listMaterialChangeRequests,
  type MaterialChangeRequestListItem,
} from "@/server/admin/material-change-requests";
import { errorMessageJa } from "@/server/errors";
import { css } from "../../../../../styled-system/css";

export const metadata: Metadata = { title: "資材変更申請" };

const linkStyle = css({
  color: "primary.700",
  fontWeight: "bold",
  textDecoration: "none",
  _hover: { textDecoration: "underline" },
});

const FILTER_OPTIONS = [
  { value: "pending", label: MATERIAL_CHANGE_REQUEST_STATUS_LABELS.pending },
  { value: "approved", label: MATERIAL_CHANGE_REQUEST_STATUS_LABELS.approved },
  { value: "rejected", label: MATERIAL_CHANGE_REQUEST_STATUS_LABELS.rejected },
  { value: "cancelled", label: MATERIAL_CHANGE_REQUEST_STATUS_LABELS.cancelled },
  { value: "all", label: "すべて" },
];

const columns: DataTableColumn<MaterialChangeRequestListItem>[] = [
  {
    key: "material",
    header: "対象資材",
    cell: (row) => (
      <Link className={linkStyle} href={`/admin/materials/requests/${row.id}`}>
        {row.materialName}
      </Link>
    ),
  },
  { key: "seller", header: "メーカー", cell: (row) => row.sellerName },
  {
    key: "type",
    header: "申請種別",
    cell: (row) =>
      isMaterialChangeType(row.change_type)
        ? MATERIAL_CHANGE_TYPE_LABELS[row.change_type]
        : row.change_type,
  },
  { key: "submitted_at", header: "申請日", cell: (row) => formatDateJa(row.submitted_at) },
  {
    key: "status",
    header: "状態",
    cell: (row) =>
      isMaterialChangeRequestStatus(row.status)
        ? MATERIAL_CHANGE_REQUEST_STATUS_LABELS[row.status]
        : row.status,
  },
  {
    key: "actions",
    header: "確認",
    cell: (row) => (
      <Link className={linkStyle} href={`/admin/materials/requests/${row.id}`}>
        内容を比較
      </Link>
    ),
  },
];

export default async function AdminMaterialChangeRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdminPage("/admin/materials/requests");
  const { status } = await searchParams;
  const selected = isMaterialChangeRequestStatus(status) || status === "all" ? status : "pending";
  const requests = await listMaterialChangeRequests(selected);
  if (!requests.ok) throw new Error(errorMessageJa[requests.error]);

  return (
    <AdminShell
      backHref="/admin/materials"
      backLabel="資材の管理"
      description="メーカーから届いた新規登録・情報変更・非公開を、公開内容と比較して処理する。"
      title="資材変更申請"
    >
      <Panel note={`${requests.data.length} 件`} title="申請一覧">
        <div className={css({ mb: "3" })}>
          <QueryFilter
            ariaLabel="状態で絞り込む"
            options={FILTER_OPTIONS}
            param="status"
            value={selected}
          />
        </div>
        <DataTable
          columns={columns}
          emptyMessage="対象の申請はありません。"
          rowKey={(row) => row.id}
          rows={requests.data}
        />
      </Panel>
    </AdminShell>
  );
}
