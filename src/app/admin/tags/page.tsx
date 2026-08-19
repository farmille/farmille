import type { Metadata } from "next";

import { AdminShell } from "@/app/admin/_components/AdminShell";
import { Panel, adminInlineNoteStyle } from "@/app/admin/_components/AdminUI";
import { requireAdminPage } from "@/app/admin/_lib/access";
import {
  CropCreateForm,
  CropRow,
  TagCreateForm,
  TagRow,
} from "@/app/admin/tags/_components/MasterForms";
import { listAdminCrops, listAdminTags, listCropGroups, TAG_CATEGORIES } from "@/server/admin/tags";
import { errorMessageJa } from "@/server/errors";
import { css } from "../../../../styled-system/css";

export const metadata: Metadata = {
  title: "タグ・作物マスタ",
};

const listStyle = css({
  display: "flex",
  flexDirection: "column",
});

export default async function AdminTagsPage() {
  await requireAdminPage("/admin/tags");

  const [tags, crops, groups] = await Promise.all([
    listAdminTags(),
    listAdminCrops(),
    listCropGroups(),
  ]);

  if (!tags.ok) throw new Error(errorMessageJa[tags.error]);
  if (!crops.ok) throw new Error(errorMessageJa[crops.error]);
  if (!groups.ok) throw new Error(errorMessageJa[groups.error]);

  return (
    <AdminShell
      backHref="/admin"
      backLabel="← 運営管理ホーム"
      description="検索の分類は Farmille が所有する（01 §3）。メーカー名・製品名はタグにしない。"
      title="タグ・作物マスタ"
    >
      <Panel note={`${tags.data.length} 件。使用中のタグは削除できない。`} title="タグ">
        <TagCreateForm categories={[...TAG_CATEGORIES]} />
        <div className={listStyle}>
          {tags.data.map((tag) => (
            <TagRow key={tag.id} tag={tag} />
          ))}
        </div>
        {tags.data.length === 0 ? (
          <p className={adminInlineNoteStyle}>タグがまだ登録されていません。</p>
        ) : null}
      </Panel>

      <Panel
        note={`${crops.data.length} 件。レビュー・使用レポート・プロフィールから参照される。`}
        title="作物マスタ"
      >
        <CropCreateForm groups={groups.data} />
        <div className={listStyle}>
          {crops.data.map((crop) => (
            <CropRow crop={crop} key={crop.id} />
          ))}
        </div>
        {crops.data.length === 0 ? (
          <p className={adminInlineNoteStyle}>作物がまだ登録されていません。</p>
        ) : null}
      </Panel>
    </AdminShell>
  );
}
