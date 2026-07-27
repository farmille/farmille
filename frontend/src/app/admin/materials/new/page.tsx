import type { Metadata } from "next";

import { AdminShell } from "@/app/admin/_components/admin-shell";
import { Panel } from "@/app/admin/_components/admin-ui";
import { requireAdminPage } from "@/app/admin/_lib/access";
import { MaterialForm } from "@/app/admin/materials/_components/material-form";
import { listAdminTags } from "@/server/admin/tags";
import { errorMessageJa } from "@/server/errors";

export const metadata: Metadata = {
  title: "資材の新規登録",
};

export default async function AdminMaterialNewPage() {
  await requireAdminPage("/admin/materials/new");

  const tags = await listAdminTags();

  if (!tags.ok) {
    throw new Error(errorMessageJa[tags.error]);
  }

  return (
    <AdminShell
      backHref="/admin/materials"
      backLabel="← 資材の管理"
      description="分類・検索層を確定し、一次情報は分かる範囲を初期値として入れる（種まき）。"
      title="資材の新規登録"
    >
      <Panel title="登録内容">
        <MaterialForm material={null} tags={tags.data} />
      </Panel>
    </AdminShell>
  );
}
