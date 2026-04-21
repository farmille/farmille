export const REVIEWER_ROLES = ["farmer", "ja_staff", "researcher"] as const;
export const MAKER_ROLES = ["maker"] as const;
export const ALL_ASSIGNED_ROLES = [
  ...REVIEWER_ROLES,
  ...MAKER_ROLES,
] as const;

export type AssignedRole = (typeof ALL_ASSIGNED_ROLES)[number];
export type Role = AssignedRole | "unassigned";

export const isAssignedRole = (role: string | null | undefined): role is AssignedRole =>
  role !== null && role !== undefined && (ALL_ASSIGNED_ROLES as readonly string[]).includes(role);

export const isReviewerRole = (role: string | null | undefined): boolean =>
  role !== null && role !== undefined && (REVIEWER_ROLES as readonly string[]).includes(role);

export const isMakerRole = (role: string | null | undefined): boolean =>
  role !== null && role !== undefined && (MAKER_ROLES as readonly string[]).includes(role);
