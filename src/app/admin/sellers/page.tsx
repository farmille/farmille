import type { Metadata } from "next";
import Link from "next/link";

import { AdminShell } from "@/app/admin/_components/AdminShell";
import { Panel } from "@/app/admin/_components/AdminUI";
import { QueryFilter } from "@/app/admin/_components/QueryFilter";
import { requireAdminPage } from "@/app/admin/_lib/access";
import { DataTable, formatDateJa, type DataTableColumn } from "@/components";
import {
  isSellerStatus,
  listSellers,
  SELLER_STATUSES,
  SELLER_STATUS_LABELS,
  type SellerListItem,
} from "@/server/admin/sellers";
import { errorMessageJa } from "@/server/errors";
import { css } from "../../../../styled-system/css";

export const metadata: Metadata = {
  title: "メーカー確認",
};

const linkStyle = css({
  color: "brand.primary",
  fontWeight: "700",
  textDecoration: "none",
  _hover: { textDecoration: "underline" },
});

const FILTER_OPTIONS = [
  { value: "applied", label: SELLER_STATUS_LABELS.applied },
  { value: "approved", label: SELLER_STATUS_LABELS.approved },
  { value: "suspended", label: SELLER_STATUS_LABELS.suspended },
  { value: "rejected", label: SELLER_STATUS_LABELS.rejected },
  { value: "all", label: "すべて" },
];

const columns: DataTableColumn<SellerListItem>[] = [
  {
    key: "official_name",
    header: "正式名称",
    cell: (row) => (
      <Link className={linkStyle} href={`/admin/sellers/${row.id}`}>
        {row.official_name}
      </Link>
    ),
  },
  { key: "login_id", header: "ログインID", cell: (row) => row.login_id },
  {
    key: "status",
    header: "状態",
    cell: (row) => (isSellerStatus(row.status) ? SELLER_STATUS_LABELS[row.status] : row.status),
  },
  { key: "created_at", header: "申請日", cell: (row) => formatDateJa(row.created_at) },
  {
    key: "approved_at",
    header: "承認日",
    cell: (row) => (row.approved_at === null ? "—" : formatDateJa(row.approved_at)),
  },
];

export default async function AdminSellersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdminPage("/admin/sellers");

  const { status } = await searchParams;
  const selected = isSellerStatus(status) || status === "all" ? status : "applied";
  const sellers = await listSellers(selected);

  if (!sellers.ok) {
    throw new Error(errorMessageJa[sellers.error]);
  }

  return (
    <AdminShell
      backHref="/admin"
      backLabel="運営管理ホーム"
      description="メーカー申請を確認し、承認したアカウントに共有ログインを発行します。"
      title="メーカー確認"
    >
      <Panel note={`${sellers.data.length} 件`} title="申請・アカウント一覧">
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
          emptyMessage={
            selected === "applied"
              ? "確認中の申請はありません。"
              : "この状態の企業会員はありません。"
          }
          rowKey={(row) => row.id}
          rows={sellers.data}
        />
        <p className={css({ mt: "2", fontSize: "sm", color: "text.subtle" })}>
          状態の内訳：{SELLER_STATUSES.map((value) => SELLER_STATUS_LABELS[value]).join("／")}
        </p>
      </Panel>
    </AdminShell>
  );
}
