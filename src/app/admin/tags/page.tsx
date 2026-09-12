import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminShell } from "@/app/admin/_components/AdminShell";
import { Panel, adminInlineNoteStyle } from "@/app/admin/_components/AdminUI";
import { requireAdminPage } from "@/app/admin/_lib/access";
import {
  CropCreateForm,
  CropRow,
  TagCreateForm,
  TagRow,
} from "@/app/admin/tags/_components/MasterForms";
import { TAG_CATEGORY_LABELS, toTagChipCategory } from "@/lib/tag-categories";
import { listAdminCrops, listAdminTags, listCropGroups, TAG_CATEGORIES } from "@/server/admin/tags";
import { errorMessageJa } from "@/server/errors";
import { css } from "../../../../styled-system/css";

export const metadata: Metadata = {
  title: "検索タグ・作物マスタ",
};

const listStyle = css({
  display: "flex",
  flexDirection: "column",
});

const groupListStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "2",
});

const groupStyle = css({
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "border.default",
});

const groupSummaryStyle = css({
  py: "3",
  color: "text.default",
  fontSize: "md",
  fontWeight: "700",
  cursor: "pointer",
  "&::marker": { color: "brand.primary" },
});

function MasterGroup({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <details className={groupStyle}>
      <summary className={groupSummaryStyle}>
        {title}（{count}件）
      </summary>
      <div className={listStyle}>{children}</div>
    </details>
  );
}

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

  const tagGroups = TAG_CATEGORIES.map((category) => ({
    category,
    items: tags.data.filter((tag) => tag.category === category),
  }));
  const groupedTagCount = tagGroups.reduce((count, group) => count + group.items.length, 0);
  if (groupedTagCount !== tags.data.length) {
    throw new Error("未対応の検索補助タグ分類があります。");
  }

  const cropGroups = groups.data.map((group) => ({
    group,
    items: crops.data.filter((crop) => crop.group_id === group.id),
  }));
  const groupedCropCount = cropGroups.reduce((count, group) => count + group.items.length, 0);
  if (groupedCropCount !== crops.data.length) {
    throw new Error("作物群に紐づかない作物があります。");
  }

  return (
    <AdminShell
      backHref="/admin"
      backLabel="運営管理ホーム"
      description="検索補助タグと対象作物を管理します。効果などの専用分類は資材フォームで選択します。"
      title="検索タグ・作物マスタ"
    >
      <Panel note={`${tags.data.length} 件。使用中のタグは削除できない。`} title="検索補助タグ">
        <TagCreateForm categories={[...TAG_CATEGORIES]} />
        <div className={groupListStyle}>
          {tagGroups.map((group) =>
            group.items.length === 0 ? null : (
              <MasterGroup
                count={group.items.length}
                key={group.category}
                title={TAG_CATEGORY_LABELS[toTagChipCategory(group.category)]}
              >
                {group.items.map((tag) => (
                  <TagRow key={tag.id} tag={tag} />
                ))}
              </MasterGroup>
            ),
          )}
        </div>
        {tags.data.length === 0 ? (
          <p className={adminInlineNoteStyle}>検索補助タグがまだ登録されていません。</p>
        ) : null}
      </Panel>

      <Panel
        note={`${crops.data.length} 件。資材・レビュー・使用レポート・プロフィールから参照される。`}
        title="作物マスタ"
      >
        <CropCreateForm groups={groups.data} />
        <div className={groupListStyle}>
          {cropGroups.map(({ group, items }) =>
            items.length === 0 ? null : (
              <MasterGroup count={items.length} key={group.id} title={group.name}>
                {items.map((crop) => (
                  <CropRow crop={crop} key={crop.id} />
                ))}
              </MasterGroup>
            ),
          )}
        </div>
        {crops.data.length === 0 ? (
          <p className={adminInlineNoteStyle}>作物がまだ登録されていません。</p>
        ) : null}
      </Panel>
    </AdminShell>
  );
}
