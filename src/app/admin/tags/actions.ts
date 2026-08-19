"use server";

import { revalidatePath } from "next/cache";

import type { AdminActionState } from "@/app/admin/_lib/action-state";
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
  const name = formData.get("name");

  return typeof name === "string" ? name.trim() : "";
}

function toSortOrder(formData: FormData): number {
  const raw = formData.get("sortOrder");
  const parsed = Number.parseInt(typeof raw === "string" ? raw : "", 10);

  return Number.isFinite(parsed) ? parsed : 0;
}

/** 表記ゆれ辞書はカンマ・読点・改行のいずれでも区切れるようにする。 */
function toAliases(formData: FormData): string[] {
  const raw = formData.get("aliases");
  if (typeof raw !== "string") return [];

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
  const operation = formData.get("operation");
  const tagId = formData.get("tagId");
  const category = formData.get("category");

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

  if (typeof tagId !== "string" || tagId.length === 0) {
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
  const operation = formData.get("operation");
  const cropId = formData.get("cropId");

  if (operation === "create") {
    const groupId = formData.get("groupId");
    if (typeof groupId !== "string" || groupId.length === 0) {
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

  if (typeof cropId !== "string" || cropId.length === 0) {
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
          "使用中の作物は削除できません。レビュー・使用レポート・プロフィールから参照されています。",
        ),
      };
    }

    refresh();

    return { status: "done", message: "作物を削除しました。" };
  }

  return { status: "error", message: errorMessageJa.invalid_body };
}
