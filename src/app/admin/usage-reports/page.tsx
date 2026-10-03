import type { Metadata } from "next";
import Link from "next/link";

import { AdminShell } from "@/app/admin/_components/AdminShell";
import { Panel } from "@/app/admin/_components/AdminUI";
import { requireAdminPage } from "@/app/admin/_lib/access";
import { DataTable, formatDateJa, type DataTableColumn } from "@/components";
import { listPendingUsageReports, type PendingUsageReportItem } from "@/server/admin/usage-reports";
import { errorMessageJa } from "@/server/errors";
import { css } from "../../../../styled-system/css";

export const metadata: Metadata = {
  title: "実証詳細レポート編集局",
};

const linkStyle = css({
  color: "primary.700",
  fontWeight: "700",
  textDecoration: "none",
  _hover: { textDecoration: "underline" },
});

const columns: DataTableColumn<PendingUsageReportItem>[] = [
  {
    key: "title",
    header: "実証詳細レポート",
    cell: (row) => (
      <Link className={linkStyle} href={`/admin/usage-reports/${row.id}`}>
        {row.title}
      </Link>
    ),
  },
  {
    key: "material",
    header: "資材",
    cell: (row) => (
      <Link className={linkStyle} href={`/admin/materials/${row.material.id}`}>
        {row.material.name}
      </Link>
    ),
  },
  { key: "crop", header: "作物", cell: (row) => row.crop.name },
  {
    key: "author",
    header: "投稿者",
    cell: (row) => (
      <Link className={linkStyle} href={`/users/${row.author.userId}`}>
        {row.author.handle}
      </Link>
    ),
  },
  { key: "created_at", header: "提出日", cell: (row) => formatDateJa(row.createdAt) },
];

export default async function AdminUsageReportsPage() {
  await requireAdminPage("/admin/usage-reports");

  const reports = await listPendingUsageReports();

  if (!reports.ok) {
    throw new Error(errorMessageJa[reports.error]);
  }

  return (
    <AdminShell
      backHref="/admin"
      description="提出済みの実証詳細レポートを確認し、本文を調整して公開または差し戻す。下書きは表示しない。"
      title="実証詳細レポート編集局"
    >
      <Link className={linkStyle} href="/admin/published-posts">
        公開済みの投稿を管理する
      </Link>
      <Panel note={`${reports.data.length} 件`} title="確認待ち">
        <DataTable
          columns={columns}
          emptyMessage="確認待ちの実証詳細レポートはありません。"
          rowKey={(row) => row.id}
          rows={reports.data}
        />
      </Panel>
    </AdminShell>
  );
}
