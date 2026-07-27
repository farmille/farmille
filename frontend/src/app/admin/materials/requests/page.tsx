import type { Metadata } from "next";
import Link from "next/link";

import { AdminShell } from "@/app/admin/_components/admin-shell";
import { Panel } from "@/app/admin/_components/admin-ui";
import { QueryFilter } from "@/app/admin/_components/query-filter";
import { requireAdminPage } from "@/app/admin/_lib/access";
import { EditRequestActions } from "@/app/admin/materials/requests/request-actions";
import { DataTable, formatDateJa, type DataTableColumn } from "@/components";
import {
  EDIT_REQUEST_STATUS_LABELS,
  isEditRequestStatus,
  listMaterialEditRequests,
  type MaterialEditRequestItem,
} from "@/server/admin/materials";
import { errorMessageJa } from "@/server/errors";
import { css } from "../../../../../styled-system/css";

export const metadata: Metadata = {
  title: "分類変更申請",
};

const linkStyle = css({
  color: "brand.primary",
  fontWeight: "700",
  textDecoration: "none",
  _hover: { textDecoration: "underline" },
});

const requestTextStyle = css({
  whiteSpace: "pre-wrap",
  maxW: "360px",
  lineHeight: "1.6",
});

const FILTER_OPTIONS = [
  { value: "open", label: EDIT_REQUEST_STATUS_LABELS.open },
  { value: "done", label: EDIT_REQUEST_STATUS_LABELS.done },
  { value: "declined", label: EDIT_REQUEST_STATUS_LABELS.declined },
  { value: "all", label: "すべて" },
];

const columns: DataTableColumn<MaterialEditRequestItem>[] = [
  {
    key: "material",
    header: "対象資材",
    cell: (row) => (
      <Link className={linkStyle} href={`/admin/materials/${row.materialId}`}>
        {row.materialName}
      </Link>
    ),
  },
  { key: "seller", header: "申請した出品者", cell: (row) => row.sellerName },
  {
    key: "request_text",
    header: "申請内容",
    cell: (row) => <p className={requestTextStyle}>{row.requestText}</p>,
  },
  { key: "created_at", header: "申請日", cell: (row) => formatDateJa(row.createdAt) },
  {
    key: "status",
    header: "状態",
    cell: (row) =>
      isEditRequestStatus(row.status) ? EDIT_REQUEST_STATUS_LABELS[row.status] : row.status,
  },
  {
    key: "actions",
    header: "処理",
    // 処理できるのは未処理のものだけ（open → done / declined）。
    cell: (row) => (row.status === "open" ? <EditRequestActions requestId={row.id} /> : "—"),
  },
];

export default async function AdminEditRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdminPage("/admin/materials/requests");

  const { status } = await searchParams;
  const selected = isEditRequestStatus(status) || status === "all" ? status : "open";
  const requests = await listMaterialEditRequests(selected);

  if (!requests.ok) {
    throw new Error(errorMessageJa[requests.error]);
  }

  return (
    <AdminShell
      backHref="/admin/materials"
      backLabel="← 資材の管理"
      description="出品者から届いた分類・検索層の変更依頼。内容を資材編集へ反映してから処理する。"
      title="分類変更申請"
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
