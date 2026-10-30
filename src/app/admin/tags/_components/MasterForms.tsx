"use client";

import { useActionState } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import { initialAdminActionState, type AdminActionState } from "@/app/admin/_lib/action-state";
import { cropOperationAction, tagOperationAction } from "@/app/admin/tags/actions";
import { Button, TAG_CATEGORY_LABELS, toTagChipCategory } from "@/components";
import { Form, Input, Notice, Select, SubmitButton } from "@/components/form";
import type { AdminCropItem, AdminTagItem, CropGroupOption } from "@/server/admin/tags";
import { css } from "../../../../../styled-system/css";

type TagCreateInput = { category: string | null; name: string; sortOrder: string };

type CropCreateInput = {
  groupId: string | null;
  name: string;
  aliases: string;
  sortOrder: string;
};

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

const nameInputStyle = css({ flex: "1", minW: "[140px]", maxW: "[260px]" });
const aliasInputStyle = css({ flex: "1", minW: "[160px]", maxW: "[300px]" });
const sortInputStyle = css({ w: "[80px]", flexShrink: "0" });
const categorySelectStyle = css({ w: "[120px]" });
const groupSelectStyle = css({ w: "[160px]" });

const usageStyle = css({
  fontSize: "sm",
  color: "text.subtle",
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
});

function StateMessage({ state }: { state: AdminActionState }) {
  if (state.status === "error") return <Notice tone="error">{state.message}</Notice>;

  if (state.status === "done") return <Notice tone="success">{state.message}</Notice>;

  return null;
}

/** DB の category 値は Server Component 側から渡す（server モジュールをクライアントに載せない）。 */
export function TagCreateForm({ categories }: { categories: string[] }) {
  const initialValues: TagCreateInput = {
    category: categories[0] ?? null,
    name: "",
    sortOrder: "0",
  };

  const form = useForm({ defaultValues: initialValues });
  const values = useStore(form.store, (state) => state.values);

  const [state, formAction] = useActionState(async (previous: AdminActionState, data: FormData) => {
    const result = await tagOperationAction(previous, data);

    if (result.status === "done") form.reset();

    return result;
  }, initialAdminActionState);

  return (
    <div>
      <StateMessage state={state} />
      <Form
        action={formAction}
        className={createRowStyle}
        persist="tag-create"
        onRestore={(restored) => {
          form.setFieldValue("category", restored.get("category")?.[0] ?? null);
          form.setFieldValue("name", restored.get("name")?.[0] ?? "");
          form.setFieldValue("sortOrder", restored.get("sortOrder")?.[0] ?? "0");
        }}
      >
        <input name="operation" type="hidden" value="create" />
        <Select
          hideLabel
          label="分類"
          className={categorySelectStyle}
          name="category"
          value={values.category}
          onValueChange={(value) => form.setFieldValue("category", value)}
          options={categories.map((category) => ({
            value: category,
            label: TAG_CATEGORY_LABELS[toTagChipCategory(category)],
          }))}
          size="sm"
        />
        <Input
          hideLabel
          label="タグ名"
          fieldClassName={nameInputStyle}
          name="name"
          value={values.name}
          onChange={(event) => form.setFieldValue("name", event.target.value)}
          placeholder="タグ名"
          size="sm"
        />
        <Input
          hideLabel
          label="並び順"
          fieldClassName={sortInputStyle}
          name="sortOrder"
          value={values.sortOrder}
          onChange={(event) => form.setFieldValue("sortOrder", event.target.value)}
          size="sm"
          type="number"
        />
        <SubmitButton pendingLabel="追加中…" size="sm">
          追加
        </SubmitButton>
      </Form>
    </div>
  );
}

export function TagRow({ tag }: { tag: AdminTagItem }) {
  const form = useForm({ defaultValues: { name: tag.name, sortOrder: String(tag.sort_order) } });
  const values = useStore(form.store, (state) => state.values);
  const [state, formAction] = useActionState(tagOperationAction, initialAdminActionState);
  const inUse = tag.usageCount > 0;

  return (
    <div>
      <StateMessage state={state} />
      <form action={formAction} className={rowStyle}>
        <input name="tagId" type="hidden" value={tag.id} />
        <span className={usageStyle}>{TAG_CATEGORY_LABELS[toTagChipCategory(tag.category)]}</span>
        <Input
          hideLabel
          label={`${tag.name} の名前`}
          fieldClassName={nameInputStyle}
          name="name"
          value={values.name}
          onChange={(event) => form.setFieldValue("name", event.target.value)}
          size="sm"
        />
        <Input
          hideLabel
          label={`${tag.name} の並び順`}
          fieldClassName={sortInputStyle}
          name="sortOrder"
          value={values.sortOrder}
          onChange={(event) => form.setFieldValue("sortOrder", event.target.value)}
          size="sm"
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
  const initialValues: CropCreateInput = {
    groupId: groups[0]?.id ?? null,
    name: "",
    aliases: "",
    sortOrder: "0",
  };

  const form = useForm({ defaultValues: initialValues });
  const values = useStore(form.store, (state) => state.values);

  const [state, formAction] = useActionState(async (previous: AdminActionState, data: FormData) => {
    const result = await cropOperationAction(previous, data);

    if (result.status === "done") form.reset();

    return result;
  }, initialAdminActionState);

  return (
    <div>
      <StateMessage state={state} />
      <Form
        action={formAction}
        className={createRowStyle}
        persist="crop-create"
        onRestore={(restored) => {
          form.setFieldValue("groupId", restored.get("groupId")?.[0] ?? null);
          form.setFieldValue("name", restored.get("name")?.[0] ?? "");
          form.setFieldValue("sortOrder", restored.get("sortOrder")?.[0] ?? "0");
          form.setFieldValue("aliases", restored.get("aliases")?.[0] ?? "");
        }}
      >
        <input name="operation" type="hidden" value="create" />
        <Select
          hideLabel
          label="作物群"
          className={groupSelectStyle}
          name="groupId"
          value={values.groupId}
          onValueChange={(value) => form.setFieldValue("groupId", value)}
          options={groups.map((group) => ({ value: group.id, label: group.name }))}
          size="sm"
        />
        <Input
          hideLabel
          label="作物名"
          fieldClassName={nameInputStyle}
          name="name"
          value={values.name}
          onChange={(event) => form.setFieldValue("name", event.target.value)}
          placeholder="作物名"
          size="sm"
        />
        <Input
          hideLabel
          label="表記ゆれ"
          fieldClassName={aliasInputStyle}
          name="aliases"
          value={values.aliases}
          onChange={(event) => form.setFieldValue("aliases", event.target.value)}
          placeholder="表記ゆれ（カンマ区切り）"
          size="sm"
        />
        <Input
          hideLabel
          label="並び順"
          fieldClassName={sortInputStyle}
          name="sortOrder"
          value={values.sortOrder}
          onChange={(event) => form.setFieldValue("sortOrder", event.target.value)}
          size="sm"
          type="number"
        />
        <SubmitButton pendingLabel="追加中…" size="sm">
          追加
        </SubmitButton>
      </Form>
    </div>
  );
}

export function CropRow({ crop }: { crop: AdminCropItem }) {
  const form = useForm({
    defaultValues: {
      name: crop.name,
      aliases: crop.aliases.join("、"),
      sortOrder: String(crop.sort_order),
    },
  });

  const values = useStore(form.store, (state) => state.values);
  const [state, formAction] = useActionState(cropOperationAction, initialAdminActionState);
  const inUse = crop.usageCount > 0;

  return (
    <div>
      <StateMessage state={state} />
      <form action={formAction} className={rowStyle}>
        <input name="cropId" type="hidden" value={crop.id} />
        <span className={usageStyle}>{crop.groupName}</span>
        <Input
          hideLabel
          label={`${crop.name} の名前`}
          fieldClassName={nameInputStyle}
          name="name"
          value={values.name}
          onChange={(event) => form.setFieldValue("name", event.target.value)}
          size="sm"
        />
        <Input
          hideLabel
          label={`${crop.name} の表記ゆれ`}
          fieldClassName={aliasInputStyle}
          name="aliases"
          value={values.aliases}
          onChange={(event) => form.setFieldValue("aliases", event.target.value)}
          placeholder="表記ゆれ（カンマ区切り）"
          size="sm"
        />
        <Input
          hideLabel
          label={`${crop.name} の並び順`}
          fieldClassName={sortInputStyle}
          name="sortOrder"
          value={values.sortOrder}
          onChange={(event) => form.setFieldValue("sortOrder", event.target.value)}
          size="sm"
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
