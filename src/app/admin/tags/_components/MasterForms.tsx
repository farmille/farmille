"use client";

import { useActionState } from "react";

import { initialAdminActionState, type AdminActionState } from "@/app/admin/_lib/action-state";
import { cropOperationAction, tagOperationAction } from "@/app/admin/tags/actions";
import { Button, Input, Select, TAG_CATEGORY_LABELS, toTagChipCategory } from "@/components";
import { FormMessage } from "@/components/auth/Fields";
import type { AdminCropItem, AdminTagItem, CropGroupOption } from "@/server/admin/tags";
import { css } from "../../../../../styled-system/css";

const rowStyle = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "2",
  py: "2",
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "border.default",
});

const createRowStyle = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "2",
  pb: "3",
});

const nameInputStyle = css({ flex: "1", minW: "140px", maxW: "260px" });
const aliasInputStyle = css({ flex: "1", minW: "160px", maxW: "300px" });
const sortInputStyle = css({ w: "80px" });
const categorySelectStyle = css({ w: "120px" });
const groupSelectStyle = css({ w: "160px" });

const usageStyle = css({
  fontSize: "sm",
  color: "text.subtle",
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
});

function StateMessage({ state }: { state: AdminActionState }) {
  if (state.status === "error") return <FormMessage tone="error">{state.message}</FormMessage>;
  if (state.status === "done") return <FormMessage tone="info">{state.message}</FormMessage>;

  return null;
}

/** DB の category 値は Server Component 側から渡す（server モジュールをクライアントに載せない）。 */
export function TagCreateForm({ categories }: { categories: string[] }) {
  const [state, formAction] = useActionState(tagOperationAction, initialAdminActionState);

  return (
    <div>
      <StateMessage state={state} />
      <form action={formAction} className={createRowStyle}>
        <input name="operation" type="hidden" value="create" />
        <Select aria-label="分類" className={categorySelectStyle} name="category">
          {categories.map((category) => (
            <option key={category} value={category}>
              {TAG_CATEGORY_LABELS[toTagChipCategory(category)]}
            </option>
          ))}
        </Select>
        <Input aria-label="タグ名" className={nameInputStyle} name="name" placeholder="タグ名" />
        <Input
          aria-label="並び順"
          className={sortInputStyle}
          defaultValue="0"
          name="sortOrder"
          type="number"
        />
        <Button size="sm" type="submit">
          追加
        </Button>
      </form>
    </div>
  );
}

export function TagRow({ tag }: { tag: AdminTagItem }) {
  const [state, formAction] = useActionState(tagOperationAction, initialAdminActionState);
  const inUse = tag.usageCount > 0;

  return (
    <div>
      <StateMessage state={state} />
      <form action={formAction} className={rowStyle}>
        <input name="tagId" type="hidden" value={tag.id} />
        <span className={usageStyle}>{TAG_CATEGORY_LABELS[toTagChipCategory(tag.category)]}</span>
        <Input
          aria-label={`${tag.name} の名前`}
          className={nameInputStyle}
          defaultValue={tag.name}
          name="name"
        />
        <Input
          aria-label={`${tag.name} の並び順`}
          className={sortInputStyle}
          defaultValue={String(tag.sort_order)}
          name="sortOrder"
          type="number"
        />
        <span className={usageStyle}>使用 {tag.usageCount} 件</span>
        <Button name="operation" size="sm" type="submit" value="rename" variant="ghost">
          保存
        </Button>
        <Button
          disabled={inUse}
          name="operation"
          size="sm"
          title={inUse ? "使用中のタグは削除できません" : undefined}
          type="submit"
          value="delete"
          variant="danger"
        >
          削除
        </Button>
      </form>
    </div>
  );
}

export function CropCreateForm({ groups }: { groups: CropGroupOption[] }) {
  const [state, formAction] = useActionState(cropOperationAction, initialAdminActionState);

  return (
    <div>
      <StateMessage state={state} />
      <form action={formAction} className={createRowStyle}>
        <input name="operation" type="hidden" value="create" />
        <Select aria-label="作物群" className={groupSelectStyle} name="groupId">
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </Select>
        <Input aria-label="作物名" className={nameInputStyle} name="name" placeholder="作物名" />
        <Input
          aria-label="表記ゆれ"
          className={aliasInputStyle}
          name="aliases"
          placeholder="表記ゆれ（カンマ区切り）"
        />
        <Input
          aria-label="並び順"
          className={sortInputStyle}
          defaultValue="0"
          name="sortOrder"
          type="number"
        />
        <Button size="sm" type="submit">
          追加
        </Button>
      </form>
    </div>
  );
}

export function CropRow({ crop }: { crop: AdminCropItem }) {
  const [state, formAction] = useActionState(cropOperationAction, initialAdminActionState);
  const inUse = crop.usageCount > 0;

  return (
    <div>
      <StateMessage state={state} />
      <form action={formAction} className={rowStyle}>
        <input name="cropId" type="hidden" value={crop.id} />
        <span className={usageStyle}>{crop.groupName}</span>
        <Input
          aria-label={`${crop.name} の名前`}
          className={nameInputStyle}
          defaultValue={crop.name}
          name="name"
        />
        <Input
          aria-label={`${crop.name} の表記ゆれ`}
          className={aliasInputStyle}
          defaultValue={crop.aliases.join("、")}
          name="aliases"
          placeholder="表記ゆれ（カンマ区切り）"
        />
        <Input
          aria-label={`${crop.name} の並び順`}
          className={sortInputStyle}
          defaultValue={String(crop.sort_order)}
          name="sortOrder"
          type="number"
        />
        <span className={usageStyle}>参照 {crop.usageCount} 件</span>
        <Button name="operation" size="sm" type="submit" value="rename" variant="ghost">
          保存
        </Button>
        <Button
          disabled={inUse}
          name="operation"
          size="sm"
          title={inUse ? "参照中の作物は削除できません" : undefined}
          type="submit"
          value="delete"
          variant="danger"
        >
          削除
        </Button>
      </form>
    </div>
  );
}
