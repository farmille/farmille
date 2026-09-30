import type { Metadata } from "next";
import Link from "next/link";

import { AdminShell } from "@/app/admin/_components/AdminShell";
import { Panel, adminInlineNoteStyle } from "@/app/admin/_components/AdminUI";
import { requireAdminPage } from "@/app/admin/_lib/access";
import { Button, DataTable, Input, type DataTableColumn } from "@/components";
import { listAdminMaterials, type AdminMaterialListItem } from "@/server/admin/materials";
import { errorMessageJa } from "@/server/errors";
import { css } from "../../../../styled-system/css";

export const metadata: Metadata = {
  title: "資材の管理",
};

const linkStyle = css({
  color: "primary.700",
  fontWeight: "700",
  textDecoration: "none",
  _hover: { textDecoration: "underline" },
});

const searchFormStyle = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
  alignItems: "center",
  mb: "3",
});

const searchInputStyle = css({ maxW: "320px" });

const headerActionsStyle = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "3",
  mb: "3",
});

const columns: DataTableColumn<AdminMaterialListItem>[] = [
  {
    key: "name",
    header: "資材名",
    cell: (row) => (
      <Link className={linkStyle} href={`/admin/materials/${row.id}`}>
        {row.name}
      </Link>
    ),
  },
  { key: "manufacturer_name", header: "メーカー名", cell: (row) => row.manufacturer_name },
  { key: "sales_status", header: "販売状況", cell: (row) => row.sales_status ?? "—" },
  {
    key: "publication_status",
    header: "公開状態",
    cell: (row) => (row.publication_status === "published" ? "公開中" : "掲載終了"),
  },
  {
    key: "claim",
    header: "claim",
    cell: (row) => (row.sellerName === null ? "未 claim" : row.sellerName),
  },
  {
    key: "verified",
    header: "メーカー確認",
    cell: (row) => (row.manufacturer_verified_at === null ? "未確認" : "確認済み"),
  },
  { key: "review_count", header: "感想口コミ", align: "end", cell: (row) => row.review_count },
];

export default async function AdminMaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdminPage("/admin/materials");

  const { q } = await searchParams;
  const keyword = q ?? "";
  const materials = await listAdminMaterials(keyword);

  if (!materials.ok) {
    throw new Error(errorMessageJa[materials.error]);
  }

  return (
    <AdminShell
      backHref="/admin"
      backLabel="運営管理ホーム"
      description="分類・検索層の種まき登録と全カラムの編集、claim の紐づけを行う。"
      title="資材の管理"
    >
      <Panel note={`${materials.data.length} 件（最大 200 件を表示）`} title="資材一覧">
        <div className={headerActionsStyle}>
          <Link href="/admin/materials/new">
            <Button size="sm">資材を新規登録</Button>
          </Link>
          <Link href="/admin/materials/requests">
            <Button size="sm" variant="ghost">
              資材変更申請を処理
            </Button>
          </Link>
        </div>
        <form action="/admin/materials" className={searchFormStyle} method="get">
          <Input
            aria-label="資材名・メーカー名で検索"
            className={searchInputStyle}
            defaultValue={keyword}
            name="q"
            placeholder="資材名・メーカー名で検索"
            type="search"
          />
          <Button size="sm" type="submit" variant="ghost">
            検索
          </Button>
        </form>
        <DataTable
          columns={columns}
          emptyMessage={
            keyword.length === 0
              ? "資材がまだ登録されていません。"
              : "条件に合う資材が見つかりません。"
          }
          rowKey={(row) => row.id}
          rows={materials.data}
        />
        <p className={css({ mt: "2" })}>
          <span className={adminInlineNoteStyle}>
            claim は編集主体との紐づけ。メーカーによる記入項目には、小さな注記を表示します。
          </span>
        </p>
      </Panel>
    </AdminShell>
  );
}
