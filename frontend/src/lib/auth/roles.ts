export const REVIEWER_ROLES = ["farmer", "ja_staff", "researcher"] as const;
export const MAKER_ROLES = ["maker"] as const;
export const ADMIN_ROLES = ["admin"] as const;
export const ALL_ASSIGNED_ROLES = [
  ...REVIEWER_ROLES,
  ...MAKER_ROLES,
  ...ADMIN_ROLES,
] as const;

// admin はパブリックサインアップ経路を持たない (ADR-0009 §2.2)。
// SIGNUP_ROLES は self-signup で選択可能なロールのみを列挙する。
export const SIGNUP_ROLES = ["farmer", "maker"] as const;
export type SignUpRole = (typeof SIGNUP_ROLES)[number];
export const isSignUpRole = (v: unknown): v is SignUpRole =>
  typeof v === "string" && (SIGNUP_ROLES as readonly string[]).includes(v);

export type AssignedRole = (typeof ALL_ASSIGNED_ROLES)[number];
export type Role = AssignedRole | "unassigned";

export const isAssignedRole = (role: string | null | undefined): role is AssignedRole =>
  role !== null && role !== undefined && (ALL_ASSIGNED_ROLES as readonly string[]).includes(role);

export const isReviewerRole = (role: string | null | undefined): boolean =>
  role !== null && role !== undefined && (REVIEWER_ROLES as readonly string[]).includes(role);

export const isMakerRole = (role: string | null | undefined): boolean =>
  role !== null && role !== undefined && (MAKER_ROLES as readonly string[]).includes(role);

// admin は reviewer でも maker でもないが、オンボーディング完了済み (assigned) として扱う。
// ADR-0009 §2.2: 既存ユーザを Supabase Studio で手動昇格させる運用のため、
// admin 化された時点でロール選択フローを通る必要はない。
export const isAdminRole = (role: string | null | undefined): boolean =>
  role !== null && role !== undefined && (ADMIN_ROLES as readonly string[]).includes(role);
