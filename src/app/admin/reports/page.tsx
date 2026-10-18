import type { Metadata } from "next";
import Link from "next/link";

import { AdminShell } from "@/app/admin/_components/AdminShell";
import { Panel, adminCodeStyle } from "@/app/admin/_components/AdminUI";
import { QueryFilter } from "@/app/admin/_components/QueryFilter";
import { requireAdminPage } from "@/app/admin/_lib/access";
import { ReportActions } from "@/app/admin/reports/ReportActions";
import { DataTable, formatDateJa, type DataTableColumn } from "@/components";
import {
  CONTENT_REPORT_STATUS_LABELS,
  CONTENT_REPORT_TARGET_LABELS,
  isContentReportStatus,
  listContentReports,
  type AdminContentReportItem,
} from "@/server/admin/reports";
import { errorMessageJa } from "@/server/errors";
import { css } from "../../../../styled-system/css";

export const metadata: Metadata = {
  title: "通報処理",
};

const linkStyle = css({
  color: "text.brand",
  fontWeight: "bold",
  textDecoration: "none",
  _hover: { textDecoration: "underline" },
});

const stackStyle = css({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "1.5",
});

const reasonStyle = css({
  maxW: "360px",
  lineHeight: "relaxed",
  whiteSpace: "pre-wrap",
});

const FILTER_OPTIONS = [
  { value: "open", label: CONTENT_REPORT_STATUS_LABELS.open },
  { value: "resolved", label: CONTENT_REPORT_STATUS_LABELS.resolved },
  { value: "dismissed", label: CONTENT_REPORT_STATUS_LABELS.dismissed },
  { value: "all", label: "すべて" },
];

function TargetLinks({ row }: { row: AdminContentReportItem }) {
  return (
    <div className={stackStyle}>
      <span>
        {CONTENT_REPORT_TARGET_LABELS[row.target.type]}：{row.target.label}
      </span>
      {row.target.publicHref === null ? null : (
        <Link className={linkStyle} href={row.target.publicHref}>
          公開側を確認
        </Link>
      )}
      {row.target.adminHref === null ? null : (
        <Link className={linkStyle} href={row.target.adminHref}>
          管理画面で確認
        </Link>
      )}
    </div>
  );
}

const columns: DataTableColumn<AdminContentReportItem>[] = [
  {
    key: "target",
    header: "対象",
    cell: (row) => <TargetLinks row={row} />,
  },
  {
    key: "reason",
    header: "通報内容",
    cell: (row) => <p className={reasonStyle}>{row.reason}</p>,
  },
  {
    key: "reporter",
    header: "通報者（内部）",
    cell: (row) => (
      <div className={stackStyle}>
        <Link className={linkStyle} href={`/users/${row.reporter.userId}`}>
          {row.reporter.handle}
        </Link>
        <span className={adminCodeStyle}>{row.reporter.userId}</span>
      </div>
    ),
  },
  { key: "created_at", header: "通報日", cell: (row) => formatDateJa(row.createdAt) },
  {
    key: "status",
    header: "状態",
    cell: (row) => CONTENT_REPORT_STATUS_LABELS[row.status],
  },
  {
    key: "resolution",
    header: "処理記録",
    cell: (row) =>
      row.resolvedAt === null ? (
        "—"
      ) : (
        <div className={stackStyle}>
          <span>{formatDateJa(row.resolvedAt)}</span>
          {row.resolvedBy === null ? null : (
            <span className={adminCodeStyle}>{row.resolvedBy}</span>
          )}
        </div>
      ),
  },
  {
    key: "actions",
    header: "処理",
    cell: (row) =>
      row.status === "open" ? (
        <ReportActions reportId={row.id} targetType={row.target.type} />
      ) : (
        "—"
      ),
  },
];

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdminPage("/admin/reports");

  const { status } = await searchParams;
  const selected = isContentReportStatus(status) || status === "all" ? status : "open";
  const reports = await listContentReports(selected);

  if (!reports.ok) {
    throw new Error(errorMessageJa[reports.error]);
  }

  return (
    <AdminShell
      backHref="/admin"
      description="対象コンテンツと通報者の内部情報を確認し、非公開化または運用対応を記録する。"
      title="通報処理"
    >
      <Panel note={`${reports.data.length} 件`} title="通報一覧">
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
          emptyMessage="対象の通報はありません。"
          rowKey={(row) => row.id}
          rows={reports.data}
        />
      </Panel>
    </AdminShell>
  );
}
