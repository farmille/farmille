export const MATERIAL_CHANGE_REQUEST_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
] as const;
export type MaterialChangeRequestStatus = (typeof MATERIAL_CHANGE_REQUEST_STATUSES)[number];

export const MATERIAL_CHANGE_REQUEST_STATUS_LABELS = {
  pending: "承認待ち",
  approved: "承認済み",
  rejected: "却下",
  cancelled: "取消済み",
} satisfies Record<MaterialChangeRequestStatus, string>;

export const MATERIAL_CHANGE_TYPES = ["create", "update", "archive"] as const;
export type MaterialChangeType = (typeof MATERIAL_CHANGE_TYPES)[number];

export const MATERIAL_CHANGE_TYPE_LABELS = {
  create: "新規登録",
  update: "情報変更",
  archive: "掲載終了",
} satisfies Record<MaterialChangeType, string>;

export function isMaterialChangeRequestStatus(
  value: string | null | undefined,
): value is MaterialChangeRequestStatus {
  return (
    value !== null && MATERIAL_CHANGE_REQUEST_STATUSES.some((candidate) => candidate === value)
  );
}

export function isMaterialChangeType(value: string): value is MaterialChangeType {
  return MATERIAL_CHANGE_TYPES.some((candidate) => candidate === value);
}
