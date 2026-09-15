"use server";

import { revalidatePath } from "next/cache";

import type { AdminActionState } from "@/app/admin/_lib/action-state";
import { formDataString, trimmedFormDataString } from "@/lib/validation";
import {
  createCrop,
  createTag,
  deleteCrop,
  deleteTag,
  isTagCategory,
  renameCrop,
  renameTag,
} from "@/server/admin/tags";
import { errorMessageJa, type ErrorCode } from "@/server/errors";

function refresh(): void {
  revalidatePath("/admin/tags");
  revalidatePath("/search");
}

function toName(formData: FormData): string {
  return trimmedFormDataString(formData.get("name"));
}

function toSortOrder(formData: FormData): number {
  const parsed = Number.parseInt(formDataString(formData.get("sortOrder")) ?? "", 10);

  return Number.isFinite(parsed) ? parsed : 0;
}

/** 表記ゆれ辞書はカンマ・読点・改行のいずれでも区切れるようにする。 */
function toAliases(formData: FormData): string[] {
  const raw = formDataString(formData.get("aliases"));
  if (raw === null) return [];

  return [
    ...new Set(
      raw
        .split(/[,、\n]/u)
        .map((alias) => alias.trim())
        .filter((alias) => alias.length > 0),
    ),
  ];
}

function masterErrorMessage(code: ErrorCode, inUseMessage: string): string {
  return code === "conflict" ? inUseMessage : errorMessageJa[code];
}

export async function tagOperationAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const operation = formDataString(formData.get("operation"));
  const tagId = formDataString(formData.get("tagId"));
  const category = formDataString(formData.get("category"));

  if (operation === "create") {
    if (!isTagCategory(category)) {
      return { status: "error", message: "分類を選んでください。" };
    }
    const name = toName(formData);
    if (name.length === 0) return { status: "error", message: "タグ名を入力してください。" };

    const result = await createTag({ name, category, sortOrder: toSortOrder(formData) });

    if (!result.ok) {
      return {
        status: "error",
        message: masterErrorMessage(result.error, "同じ分類に同じ名前のタグがすでにあります。"),
      };
    }

    refresh();

    return { status: "done", message: `タグ「${name}」を追加しました。` };
  }

  if (tagId === null || tagId.length === 0) {
    return { status: "error", message: errorMessageJa.invalid_body };
  }

  if (operation === "rename") {
    const name = toName(formData);
    if (name.length === 0) return { status: "error", message: "タグ名を入力してください。" };

    const result = await renameTag(tagId, { name, sortOrder: toSortOrder(formData) });

    if (!result.ok) {
      return {
        status: "error",
        message: masterErrorMessage(result.error, "同じ分類に同じ名前のタグがすでにあります。"),
      };
    }

    refresh();

    return { status: "done", message: "タグを更新しました。" };
  }

  if (operation === "delete") {
    const result = await deleteTag(tagId);

    if (!result.ok) {
      return {
        status: "error",
        message: masterErrorMessage(
          result.error,
          "使用中のタグは削除できません。先に資材からタグを外してください。",
        ),
      };
    }

    refresh();

    return { status: "done", message: "タグを削除しました。" };
  }

  return { status: "error", message: errorMessageJa.invalid_body };
}

export async function cropOperationAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const operation = formDataString(formData.get("operation"));
  const cropId = formDataString(formData.get("cropId"));

  if (operation === "create") {
    const groupId = formDataString(formData.get("groupId"));
    if (groupId === null || groupId.length === 0) {
      return { status: "error", message: "作物群を選んでください。" };
    }
    const name = toName(formData);
    if (name.length === 0) return { status: "error", message: "作物名を入力してください。" };

    const result = await createCrop({
      groupId,
      name,
      aliases: toAliases(formData),
      sortOrder: toSortOrder(formData),
    });

    if (!result.ok) {
      return {
        status: "error",
        message: masterErrorMessage(result.error, "同じ名前の作物がすでにあります。"),
      };
    }

    refresh();

    return { status: "done", message: `作物「${name}」を追加しました。` };
  }

  if (cropId === null || cropId.length === 0) {
    return { status: "error", message: errorMessageJa.invalid_body };
  }

  if (operation === "rename") {
    const name = toName(formData);
    if (name.length === 0) return { status: "error", message: "作物名を入力してください。" };

    const result = await renameCrop(cropId, {
      name,
      aliases: toAliases(formData),
      sortOrder: toSortOrder(formData),
    });

    if (!result.ok) {
      return {
        status: "error",
        message: masterErrorMessage(result.error, "同じ名前の作物がすでにあります。"),
      };
    }

    refresh();

    return { status: "done", message: "作物を更新しました。" };
  }

  if (operation === "delete") {
    const result = await deleteCrop(cropId);

    if (!result.ok) {
      return {
        status: "error",
        message: masterErrorMessage(
          result.error,
          "使用中の作物は削除できません。感想口コミ・実証詳細レポート・プロフィールから参照されています。",
        ),
      };
    }

    refresh();

    return { status: "done", message: "作物を削除しました。" };
  }

  return { status: "error", message: errorMessageJa.invalid_body };
}
